#!/usr/bin/env python3
"""Minimal localhost predictive and retrieval-grounded services for Course 21."""

from __future__ import annotations

import argparse
import json
import re
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

PREDICTIVE_CANDIDATE = "classifier-model-bad-alias"
PREDICTIVE_ROLLBACK = "classifier-model-1.0.0"
RAG_CANDIDATE = "index-contaminated-2.0.0"
RAG_ROLLBACK = "index-clean-1.9.0"
PLANTED_MARKER = "FAKE_SECRET_DO_NOT_USE"


def load_fixture(course_dir: Optional[Path] = None) -> Dict[str, Any]:
    root = course_dir or Path(__file__).resolve().parent.parent
    return json.loads((root / "fixtures/dual-system-operations-v1.json").read_text(encoding="utf-8"))


class PredictiveService:
    endpoint = "/predict"

    def __init__(self, version: str = PREDICTIVE_CANDIDATE) -> None:
        self.version = version

    def set_version(self, version: str) -> None:
        if version not in (PREDICTIVE_CANDIDATE, PREDICTIVE_ROLLBACK):
            raise ValueError("unknown predictive model version")
        self.version = version

    def handle(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        request_id = payload.get("requestId")
        signal = payload.get("signal")
        if not isinstance(request_id, str) or not re.fullmatch(r"pred-[a-z0-9-]+", request_id):
            raise ValueError("requestId must match pred-[a-z0-9-]+")
        if not isinstance(signal, (int, float)) or isinstance(signal, bool) or not 0 <= float(signal) <= 1:
            raise ValueError("signal must be a number in [0, 1]")
        signal = float(signal)
        prediction = "route-b" if signal >= 0.5 else "route-a"
        # The authored candidate has a narrow bad alias that clean traffic misses.
        if self.version == PREDICTIVE_CANDIDATE and 0.75 <= signal < 0.9:
            prediction = "route-a"
        return {
            "requestId": request_id,
            "service": "predictive",
            "modelVersion": self.version,
            "prediction": prediction,
            "logicalLatencyUnits": 5 if self.version == PREDICTIVE_CANDIDATE else 3,
            "costUnits": 1,
            "traceComplete": True,
        }


class RagService:
    endpoint = "/answer"

    def __init__(self, fixture: Dict[str, Any], index_version: str = RAG_CANDIDATE) -> None:
        self.fixture = fixture
        self.index_version = index_version
        self.documents = {document["documentId"]: document for document in fixture["documents"]}

    def set_version(self, version: str) -> None:
        if version not in (RAG_CANDIDATE, RAG_ROLLBACK):
            raise ValueError("unknown RAG index version")
        self.index_version = version

    @staticmethod
    def tokens(text: str) -> set:
        return set(re.findall(r"[a-z0-9]+", text.lower()))

    def retrieve(self, question: str) -> Dict[str, Any]:
        approved = [document for document in self.documents.values() if document["status"] == "approved"]
        if self.index_version == RAG_CANDIDATE:
            # Deliberate retrieval degradation: poison for A; wrong approved policy for B.
            if "lab a" in question.lower():
                return self.documents["doc-poison-x"]
            return self.documents["doc-policy-a"]
        question_tokens = self.tokens(question)
        question_lower = question.lower()
        return max(
            approved,
            key=lambda document: (
                len(question_tokens & self.tokens(document["text"]))
                + (10 if "lab a" in question_lower and "lab a" in document["text"].lower() else 0)
                + (10 if "lab b" in question_lower and "lab b" in document["text"].lower() else 0),
                document["documentId"],
            ),
        )

    def handle(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        request_id = payload.get("requestId")
        question = payload.get("question")
        if not isinstance(request_id, str) or not re.fullmatch(r"rag-[a-z0-9-]+", request_id):
            raise ValueError("requestId must match rag-[a-z0-9-]+")
        if not isinstance(question, str) or len(question.strip()) < 10:
            raise ValueError("question must be a non-empty course-fixture question")
        document = self.retrieve(question)
        blocked = PLANTED_MARKER in document["text"] or document["status"] != "approved"
        output = "[BLOCKED]" if blocked else "{} [{}].".format(document["text"].rstrip("."), document["documentId"])
        expected_document = "doc-policy-a" if "lab a" in question.lower() else "doc-policy-b"
        supported = document["documentId"] == expected_document and not blocked
        return {
            "requestId": request_id,
            "service": "rag",
            "indexVersion": self.index_version,
            "answer": output,
            "citations": [document["documentId"]],
            "supported": supported,
            "securityBlocked": blocked,
            "logicalLatencyUnits": 9 if self.index_version == RAG_CANDIDATE else 6,
            "costUnits": 2,
            "traceComplete": True,
        }


def handler_for(service: Any):
    class JsonHandler(BaseHTTPRequestHandler):
        def do_POST(self) -> None:  # noqa: N802 - stdlib handler API
            if self.path != service.endpoint:
                self.send_error(404)
                return
            try:
                content_length = int(self.headers.get("Content-Length", "0"))
                if content_length <= 0 or content_length > 16384:
                    raise ValueError("invalid content length")
                payload = json.loads(self.rfile.read(content_length).decode("utf-8"))
                if not isinstance(payload, dict):
                    raise ValueError("JSON body must be an object")
                response = service.handle(payload)
                status = 200
            except (ValueError, json.JSONDecodeError, UnicodeDecodeError) as error:
                response = {"error": str(error)}
                status = 400
            body = json.dumps(response, sort_keys=True).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, format: str, *args: Any) -> None:
            return

    return JsonHandler


def start_server(service: Any, port: int = 0) -> Tuple[ThreadingHTTPServer, threading.Thread, str]:
    server = ThreadingHTTPServer(("127.0.0.1", port), handler_for(service))
    thread = threading.Thread(target=server.serve_forever, name="course21-{}".format(service.endpoint), daemon=True)
    thread.start()
    host, assigned_port = server.server_address
    return server, thread, "http://{}:{}{}".format(host, assigned_port, service.endpoint)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--service", choices=("predictive", "rag"), required=True)
    parser.add_argument("--port", type=int, required=True)
    args = parser.parse_args()
    fixture = load_fixture()
    service = PredictiveService() if args.service == "predictive" else RagService(fixture)
    server = ThreadingHTTPServer(("127.0.0.1", args.port), handler_for(service))
    print("Course 21 {} teaching service listening on 127.0.0.1:{}{}".format(args.service, args.port, service.endpoint))
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
