/**
 * Floating Google-color shapes behind the quest. Pure CSS transforms (GPU-cheap),
 * frozen automatically in speed mode / reduced motion by the global CSS rules.
 */
const SHAPES = [
  { cls: "left-[3%] top-[18%] h-10 w-10 rounded-full", color: "#4285F4", anim: "floaty-a" },
  { cls: "right-[4%] top-[12%] h-9 w-9 rotate-12 rounded-xl", color: "#EA4335", anim: "floaty-b" },
  { cls: "right-[6%] top-[58%] h-0 w-0", color: "", anim: "floaty-a", triangle: "#FBBC04" },
  { cls: "left-[5%] bottom-[14%] h-11 w-11 rounded-full border-[6px] bg-transparent", color: "", ring: "#34A853", anim: "floaty-b" },
  { cls: "left-[46%] top-[6%] h-5 w-5 rounded-md", color: "#FBBC04", anim: "floaty-b" },
  { cls: "right-[30%] bottom-[6%] h-6 w-6 rounded-full", color: "#4285F4", anim: "floaty-a" },
] as const;

export function BackgroundFX() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden opacity-60 lg:opacity-80">
      {SHAPES.map((s, i) => (
        <span
          key={i}
          className={`absolute ${s.cls} ${s.anim}`}
          style={{
            background: s.color || undefined,
            borderColor: "ring" in s ? s.ring : undefined,
            ...("triangle" in s
              ? {
                  borderLeft: "18px solid transparent",
                  borderRight: "18px solid transparent",
                  borderBottom: `32px solid ${s.triangle}`,
                }
              : {}),
            animationDelay: `${i * -1.7}s`,
          }}
        />
      ))}
      {/* Code brackets, a nod to the GDG logo */}
      <svg className="floaty-a absolute right-[12%] bottom-[26%] h-10 w-16" viewBox="0 0 64 40" style={{ animationDelay: "-3s" }}>
        <path d="M22 6 L6 20 L22 34" stroke="#EA4335" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M42 6 L58 20 L42 34" stroke="#34A853" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  );
}
