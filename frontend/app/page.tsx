"use client";

import { useTestStore } from "../store/useTestStore";

export default function HomePage() {
  const count = useTestStore((state) => state.count);
  const increment = useTestStore((state) => state.increment);
  const decrement = useTestStore((state) => state.decrement);

  return (
    <main>
      <h1 className="">Zustand Test</h1>
      <p>Count: {count}</p>
      <button type="button" onClick={increment}>
        +
      </button>
      <button type="button" onClick={decrement}>
        -
      </button>
    </main>
  );
}
