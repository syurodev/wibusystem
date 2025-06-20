"use client";
import { useDeviceInfo } from "@/hooks/useDeviceInfo";

const AuthPage = () => {
  const deviceInfo = useDeviceInfo();

  console.log(deviceInfo);

  return <div>AuthPage</div>;
};

export default AuthPage;
