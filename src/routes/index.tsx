import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "ANVEO HUB — Acesso" },
      { name: "description", content: "Acesso seguro ao sistema operacional comercial ANVEO HUB." },
      { property: "og:title", content: "ANVEO HUB — Acesso" },
      { property: "og:description", content: "Acesso seguro ao sistema operacional comercial ANVEO HUB." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    throw redirect({ to: data.user ? "/dashboard" : "/auth" });
  },
  component: () => null,
});