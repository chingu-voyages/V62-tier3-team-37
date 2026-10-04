"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";

/**
 * The only module that touches GSAP directly.
 *
 * Registering `useGSAP` once here means the rest of the app never has to know
 * about plugin registration, and keeps the animation engine swappable behind
 * one import. This module is a client boundary: everything that imports it
 * (the reusable motion components) is client-side by definition.
 */
gsap.registerPlugin(useGSAP);

export { gsap, useGSAP };
