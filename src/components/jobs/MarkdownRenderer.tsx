// components/MarkdownRenderer.tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  repairMissingHeadingBreaks,
  repairShiftedListText,
} from "@/lib/jobs/repairDescriptionText";

export default function MarkdownRenderer({ content }: { content: string }) {
  const repaired = repairShiftedListText(repairMissingHeadingBreaks(content));
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{repaired}</ReactMarkdown>;
}
