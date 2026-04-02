import ChatContainer from "./components/ChatContainer";

export default function AppHomePage() {
  return <ChatContainer initialMessages={[]} sessionMeta={{ mode: "SOCRATIC" }} />;
}
