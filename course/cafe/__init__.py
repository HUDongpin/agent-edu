"""Shared bits for the course. Import from here, don't copy-paste between stages.

Submodules are deliberately NOT imported here. Stage 1 uses no model at all,
and importing `cafe.llm` eagerly would drag in the `anthropic` package and
make the one stage that needs nothing fail without it.

    from cafe.menu import MENU     # no SDK required
    from cafe import llm           # SDK required, and only now
"""
