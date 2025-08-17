"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Container from "@/components/container";
import axios, { AxiosResponse } from "axios";
import { apiUrl } from "@repo/shared-types/portsAndUrl";
import { FrontendApiMessageType } from "@repo/shared-types/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function Signin() {
    const router = useRouter();
    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const response: AxiosResponse = await axios.post(`${apiUrl}/auth/signin`, {
            email: form.email,
            password: form.password
        })

        const data: FrontendApiMessageType = response.data;

        if (data.type === "SUCCESS") {
            localStorage.setItem("uid", data.userId.toString());
            toast.success("Successful");
            router.push("/");
        } else {
            toast.error(data.message);
        }
    };

    return (
        <Container>
            <div className="max-w-sm m-auto border py-3 px-4 rounded-xl flex flex-col gap-3 h-full">
                <div className="text-2xl font-bold">
                    Signin
                </div>
                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-3"
                >
                    <Input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={handleChange}
                    />
                    <Input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange}
                    />
                    <Button type="submit" className="w-full">
                        Sign In
                    </Button>
                </form>
            </div>
        </Container>
    );
}
