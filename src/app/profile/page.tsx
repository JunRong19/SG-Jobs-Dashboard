import { getUserProfileByEmail } from "@/lib/supabase/queries";
import { Resume } from "@/types";
import ProfileClient from "@/components/profile/ProfileClient";
import { User } from "lucide-react";

export default async function Profile() {
  const userProfile: Resume | null = await getUserProfileByEmail();

  if (!userProfile) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-gray-400" />
        </div>
        <h1 className="text-xl font-semibold text-slate-800 mb-2">
          No Profile Found
        </h1>
        <p className="text-sm text-slate-500 max-w-md">
          Your base resume hasn&apos;t been set up yet. Upload a resume PDF to
          Supabase Storage and run the parsing workflow to populate your profile.
        </p>
      </div>
    );
  }

  return <ProfileClient initialData={userProfile} />;
}
