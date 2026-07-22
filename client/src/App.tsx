import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import NewPostPage from "./pages/NewPostPage";
import PostDetailPage from "./pages/PostDetailPage";
import EditPostPage from "./pages/EditPostPage";
import MePage from "./pages/MePage";
import AdminPage from "./pages/AdminPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="posts/new" element={<NewPostPage />} />
        <Route path="posts/:id" element={<PostDetailPage />} />
        <Route path="posts/:id/edit" element={<EditPostPage />} />
        <Route path="me" element={<MePage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
