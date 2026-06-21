'use client';

import { RepoLayout } from '@/components/repo/RepoLayout';
import { useRepo } from '@/components/repo/RepoLayout';
import { ChatInterface } from '@/components/chat/ChatInterface';

function ChatContent() {
  const { id } = useRepo();
  return <ChatInterface repoId={id} />;
}

export default function RepoChatPage() {
  return (
    <RepoLayout>
      <ChatContent />
    </RepoLayout>
  );
}
