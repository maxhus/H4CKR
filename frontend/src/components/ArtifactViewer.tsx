interface ArtifactViewerProps {
  type: string;
  url: string;
}

export default function ArtifactViewer({ type, url }: ArtifactViewerProps) {
  if (type === "image") {
    return <img src={url} className="max-w-full border border-green-800 mt-2" alt="Artifact" />;
  }
  if (type === "text" || type === "pdf") {
    return <iframe src={url} className="w-full h-64 border border-green-800 mt-2" title="Artifact" />;
  }
  return (
    <a 
      href={url} 
      download 
      className="text-green-400 underline hover:text-green-200 mt-2 inline-block"
    >
      📥 Download Artifact
    </a>
  );
}
