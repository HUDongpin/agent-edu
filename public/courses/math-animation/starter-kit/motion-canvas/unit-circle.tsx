import {Circle, Line, makeScene2D} from '@motion-canvas/2d';
import {createSignal, easeInOutCubic, Vector2} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  const angle = createSignal(0);
  const radius = 220;
  const circleOrigin = new Vector2(-420, 0);
  const graphStart = 0;
  const graphWidth = 700;
  const point = () => circleOrigin.add(new Vector2(
    radius * Math.cos(angle()),
    -radius * Math.sin(angle()),
  ));
  const graphPoint = () => new Vector2(
    graphStart + (angle() / (Math.PI * 2)) * graphWidth,
    -radius * Math.sin(angle()),
  );
  const trace = () => Array.from({length: 91}, (_, index) => {
    const sample = Math.min(angle(), (index / 90) * Math.PI * 2);
    return new Vector2(
      graphStart + (sample / (Math.PI * 2)) * graphWidth,
      -radius * Math.sin(sample),
    );
  });

  view.add(
    <>
      <Circle position={circleOrigin} size={radius * 2} stroke={'#2458a6'} lineWidth={8} />
      <Line points={() => [circleOrigin, point()]} stroke={'#1d2635'} lineWidth={5} />
      <Line points={() => [point(), new Vector2(point().x, 0)]} stroke={'#2458a6'} lineWidth={4} />
      <Circle position={point} size={28} fill={'#2458a6'} />
      <Line points={[[graphStart, 0], [graphStart + graphWidth, 0]]} stroke={'#68758b'} lineWidth={3} />
      <Line points={trace} stroke={'#2458a6'} lineWidth={7} />
      <Line points={() => [new Vector2(graphPoint().x, 0), graphPoint()]} stroke={'#2458a6'} lineWidth={4} />
      <Circle position={graphPoint} size={26} fill={'#2458a6'} />
    </>,
  );

  yield* angle(Math.PI * 2, 8, easeInOutCubic);
});
