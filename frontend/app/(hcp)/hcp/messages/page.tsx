import { HcpMessageDesk } from "@/components/features/messages/HcpMessageDesk";

export default async function HcpMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string }>;
}) {
  const params = await searchParams;
  const withId = Number(params.with);
  return (
    <div className="w-full">
      <HcpMessageDesk initialUserId={Number.isInteger(withId) && withId > 0 ? withId : undefined} />
    </div>
  );
}
