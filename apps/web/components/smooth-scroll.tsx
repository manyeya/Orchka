"use client";

import { ReactNode, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { useGSAP } from "@gsap/react";

export const SmoothScroll = ({ children }: { children: ReactNode }) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

        ScrollSmoother.create({
            wrapper: wrapperRef.current,
            content: contentRef.current,
            smooth: 1.5,
            effects: true,
            smoothTouch: 0.1,
        });
    }, { scope: wrapperRef });

    return (
        <div ref={wrapperRef} id="smooth-wrapper">
            <div ref={contentRef} id="smooth-content">
                {children}
            </div>
        </div>
    );
};
