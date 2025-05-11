"use client";

import { redirect } from 'next/navigation';
import { useParams } from 'next/navigation';

function page() {
  const { sessionId } = useParams();
  redirect(`/dashboard/tutor/chat/${sessionId}`);
}

export default page
