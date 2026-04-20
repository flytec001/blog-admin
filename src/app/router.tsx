import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "./AppShell";
import { LoginPage } from "../features/auth/LoginPage";
import { MediaLibraryPage } from "../features/media/pages/MediaLibraryPage";
import { PostEditorPage } from "../features/posts/pages/PostEditorPage";
import { PostListPage } from "../features/posts/pages/PostListPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/posts" replace /> },
      { path: "posts", element: <PostListPage /> },
      { path: "posts/new", element: <PostEditorPage /> },
      { path: "posts/:slug", element: <PostEditorPage /> },
      { path: "media", element: <MediaLibraryPage /> },
    ],
  },
]);
