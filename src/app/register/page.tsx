import { cookies } from "next/headers";
import AuthForm from "../components/AuthForm/AuthForm";
import { redirect } from "next/navigation";

export default async function RegisterPage() {
    const cookiesStore = await cookies();
    const tokem = cookiesStore.get("token")?.value;
    if (tokem) {
        redirect("/landing");
    }

    return <AuthForm mode="register" />;
}