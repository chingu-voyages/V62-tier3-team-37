"use client";

import Image from "next/image";
import { useState } from "react";

export function HCPDirectoryHeader() {
  const [_imageFailed, setImageFailed] = useState(false);

  return (
    <div className="flex lg:max-w-7xl flex-row items-center bg-primary px-5 py-3 md:py-2 md:justify-center gap-5 lg:gap-15 xl:gap-25 md:flex-row-reverse md:items-center rounded-4xl pointer-none:">
      <div className="max-w-2xl">
        <p className="type-label font-medium text-primary-foreground">Find a Doctor</p>
        <h1 className="mt-2 type-h4 md:type-h1 text-accent">
          Find the right doctor for your needs
        </h1>
        <p className="mt-3 type-helper md:type-body text-primary-foreground">
          Search by specialty, location, or name to connect with trusted healthcare professionals.
        </p>
      </div>
      <div className="items-center gap-5 hidden sm:flex">
        <Image
          className=" md:h-65 md:w-75 scale-120 md:scale-95 lg:w-65 lg:scale-115 xl:scale-135 object-cover"
          src="/images/patient/hcp-search.webp"
          alt=""
          width={300}
          height={300}
          onError={() => setImageFailed(true)}
        />
      </div>
    </div>
  );
}
