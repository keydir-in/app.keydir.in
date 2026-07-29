/**
 * Terminal-styled auth header with a fake window bar and title.
 * Wraps children in a terminal UI frame for the auth section.
 * Exports: AuthTerminal
 */

interface AuthTerminalProps {
  children: React.ReactNode;
}

export function AuthTerminal({ children }: AuthTerminalProps) {
  return (
    <div className="terminal auth-visible">
      <div className="t-bar">
        <div className="t-dot" />
        <div className="t-dot" />
        <div className="t-dot" />
        <span className="auth-term-title">auth.keydir.sh</span>
      </div>
      <div className="auth-gap">
        {children}
      </div>
    </div>
  );
}
