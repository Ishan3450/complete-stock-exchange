type ContainerProps = {
    children: React.ReactNode;
    className?: string;
};

export default function Container({ children, className }: ContainerProps) {
    return <div className={`max-w-[85%] m-auto py-5 ${className}`}>{children}</div>;
}
