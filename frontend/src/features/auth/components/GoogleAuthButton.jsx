// import { cn } from "../../../utils/cn";

// const GoogleIcon = () => (
//   <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
//     <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
//     <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
//     <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
//     <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
//   </svg>
// );

// // Nút này gom giao diện đăng nhập/đăng ký Google để 2 màn auth không bị lặp JSX quá nhiều.
// export default function GoogleAuthButton({
//   disabled = false,
//   isLoading = false,
//   label = "Tiếp tục với Google",
//   onClick,
// }) {
//   return (
//     <button
//       type="button"
//       disabled={disabled}
//       onClick={onClick}
//       className={cn(
//         "flex w-full items-center justify-center gap-3",
//         "min-h-[54px] rounded-[12px] border-2 border-[#e2e8f0] bg-white",
//         "text-[15px] font-semibold text-[#1e293b]",
//         "transition-all duration-200 hover:border-[#cbd5e1] hover:bg-[#f8fafc] hover:-translate-y-0.5 hover:shadow-sm",
//         "focus-visible:outline-none",
//         "disabled:cursor-not-allowed disabled:opacity-60",
//       )}
//     >
//       <GoogleIcon />
//       {isLoading ? "Đang mở Google..." : label}
//     </button>
//   );
// }
