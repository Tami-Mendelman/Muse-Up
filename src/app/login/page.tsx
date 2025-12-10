import { redirect } from "next/navigation";
import AuthForm from "../components/AuthForm/AuthForm";
import { cookies } from "next/headers";

export default async function LoginPage() {
    const cookiesStore = await cookies();
    const tokem = cookiesStore.get("token")?.value;
    if (tokem) {
        redirect("/landing");
    }

    return <AuthForm mode="login" />;
}