export default function BackgroundOrbs() {
    return (
        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none" aria-hidden="true">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] rounded-full bg-accent blur-[80px] animate-float" />
            <div
                className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] rounded-full bg-peach blur-[100px]"
                style={{ animationDelay: "2s" }}
            />
            <div
                className="absolute top-[40%] left-[30%] w-[40%] h-[30%] rounded-full bg-primary/20 blur-[60px]"
                style={{ animationDelay: "4s" }}
            />
        </div>
    );
}
