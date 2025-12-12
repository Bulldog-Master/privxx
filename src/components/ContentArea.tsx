interface ContentAreaProps {
  url: string | null;
  latency: number | null;
}

const ContentArea = ({ url, latency }: ContentAreaProps) => {
  if (!url || latency === null) {
    return null;
  }

  return (
    <div className="w-full max-w-md p-6 bg-card/50 rounded-xl border border-border space-y-4">
      <div className="space-y-2 text-sm">
        <p className="text-muted-foreground">
          <span className="text-foreground font-medium">Requested URL: </span>
          <span className="font-mono">{url}</span>
        </p>
        <p className="text-muted-foreground">
          <span className="text-foreground font-medium">Simulated latency: </span>
          <span className="font-mono">{latency}ms</span>
        </p>
      </div>
      
      <div className="p-4 bg-secondary/30 rounded-lg border border-border">
        <p className="text-sm text-muted-foreground text-center">
          Proxied content will appear here in a future version.
        </p>
      </div>
    </div>
  );
};

export default ContentArea;
