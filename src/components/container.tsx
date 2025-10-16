interface ContainerProps {
  children: React.ReactNode
}

// Server Component - just a layout wrapper, no interactivity needed
export function Container({ children }: ContainerProps) {
  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="mx-auto max-w-2xl lg:max-w-none">
        {children}
      </div>
    </div>
  )
}
