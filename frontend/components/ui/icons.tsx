function PlusIcon({ classname }: { classname?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={classname}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M5 12H19M11.995 19.005V5.005" />
    </svg>
  );
}

export { PlusIcon };
