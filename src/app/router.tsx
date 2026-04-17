import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "./AppShell";
import { PostEditorPage } from "../features/posts/pages/PostEditorPage";
import { PostListPage } from "../features/posts/pages/PostListPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/posts" replace /> },
      { path: "posts", element: <PostListPage /> },
      { path: "posts/new", element: <PostEditorPage /> },
      { path: "posts/:slug", element: <PostEditorPage /> },
    ],
  },
]);
