import React from 'react';

type State = { error: Error | null };

export default class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, State> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: any) {
    // console log so developer can see stack in terminal
    // eslint-disable-next-line no-console
    console.error('Unhandled error in UI:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-xl w-full bg-card border border-border rounded-md p-6">
            <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
            <pre className="text-xs text-muted-foreground overflow-auto max-h-48 whitespace-pre-wrap">{this.state.error?.message}</pre>
          </div>
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}
