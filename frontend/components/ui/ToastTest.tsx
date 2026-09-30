"use client";

import { useToast } from "./ToastProvider";

export default function ToastTest() {
  const { showToast } = useToast();

  return (
    <button
      onClick={() =>
        showToast({
          type: "success",
          title: "Success",
          message: "Toast system is working.",
        })
      }
      className="rounded-lg bg-black px-4 py-2 text-white"
    >
      Test Toast
    </button>
  );
}