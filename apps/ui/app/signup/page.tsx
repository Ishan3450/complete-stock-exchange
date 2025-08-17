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


export default function Signup() {
    const router = useRouter();
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const response: AxiosResponse = await axios.post(`${apiUrl}/auth/signup`, {
            username: form.name,
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
                    Signup
                </div>
                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-3"
                >
                    <Input
                        name="name"
                        placeholder="Full Name"
                        value={form.name}
                        onChange={handleChange}
                    />
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
                        Sign Up
                    </Button>
                </form>
            </div>
        </Container>
    );
}
