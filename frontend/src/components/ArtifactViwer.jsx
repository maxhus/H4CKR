export default function ArtifactViewer({ type, url }) {
  if (type === "image") return <img src={url} className="max-w-full" />;
  if (type === "text") return <iframe src={url} className="w-full h-64" />;
  return <a href={url} download className="text-cyan-400 underline">Download Artifact</a>;
}