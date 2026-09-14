import { createElement, type ElementType, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type HeadingLevel = 1 | 2 | 3 | 4;

const headingClasses: Record<HeadingLevel, string> = {
  1: "font-display text-2xl font-bold text-ink sm:text-3xl",
  2: "font-display text-xl font-semibold text-ink sm:text-2xl",
  3: "text-lg font-semibold text-ink",
  4: "text-base font-semibold text-ink",
};

const headingTags: Record<HeadingLevel, ElementType> = { 1: "h1", 2: "h2", 3: "h3", 4: "h4" };

interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel;
  as?: ElementType;
}

export function Heading({ level = 1, as, className, children, ...props }: HeadingProps) {
  return createElement(as ?? headingTags[level], { className: cn(headingClasses[level], className), ...props }, children);
}

type TextVariant = "body" | "muted" | "small" | "eyebrow";

const textClasses: Record<TextVariant, string> = {
  body: "text-sm text-ink/80",
  muted: "text-sm text-ink/55",
  small: "text-xs text-ink/55",
  eyebrow: "text-xs font-semibold uppercase tracking-wide text-ink/45",
};

interface TextProps extends HTMLAttributes<HTMLParagraphElement> {
  variant?: TextVariant;
  as?: ElementType;
}

export function Text({ variant = "body", as = "p", className, children, ...props }: TextProps) {
  return createElement(as, { className: cn(textClasses[variant], className), ...props }, children);
}
