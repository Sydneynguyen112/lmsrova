"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sprout,
  Plus,
  Mic,
  BookOpen,
  Calendar,
  Eye,
  EyeOff,
  Pencil,
  X,
  Heart,
  MessageCircle,
  ImagePlus,
} from "lucide-react";
import { getAllPosts, getCommentsByPost, users } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { PageTransition } from "@/components/shared/PageTransition";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function AdminBlogPage() {
  const posts = getAllPosts();
  const [showEditor, setShowEditor] = useState(false);
  const [form, setForm] = useState({
    title: "",
    type: "article" as "article" | "podcast",
    summary: "",
    content: "",
    cover_url: "",
  });
  const [imagePreview, setImagePreview] = useState("");

  const publishedCount = posts.filter((p) => p.published).length;
  const draftCount = posts.filter((p) => !p.published).length;
  const totalLikes = posts.reduce((sum, p) => sum + p.likes, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("New post:", form);
    setForm({ title: "", type: "article", summary: "", content: "", cover_url: "" });
    setImagePreview("");
    setShowEditor(false);
  };

  const handleImageUrl = (url: string) => {
    setForm({ ...form, cover_url: url });
    setImagePreview(url);
  };

  return (
    <PageTransition>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        <motion.div
          variants={item}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <Sprout className="h-7 w-7 text-gold" />
              <span className="gold-gradient-text">Vườn ươm tâm thức</span>
            </h1>
            <p className="mt-1 text-muted-foreground">
              Quản lý bài viết & podcast cho học viên
            </p>
          </div>
          <Button
            onClick={() => setShowEditor(!showEditor)}
            className="bg-gold hover:bg-gold/90 text-black font-semibold"
          >
            {showEditor ? (
              <><X className="h-4 w-4 mr-2" /> Đóng</>
            ) : (
              <><Plus className="h-4 w-4 mr-2" /> Tạo bài mới</>
            )}
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div variants={item} className="flex gap-5 flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <Eye className="h-4 w-4 text-emerald-500" />
            <span className="text-foreground font-medium">{publishedCount}</span>
            <span className="text-muted-foreground">đã đăng</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <EyeOff className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground font-medium">{draftCount}</span>
            <span className="text-muted-foreground">nháp</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Heart className="h-4 w-4 text-red-400" />
            <span className="text-foreground font-medium">{totalLikes}</span>
            <span className="text-muted-foreground">lượt thích</span>
          </div>
        </motion.div>

        {/* Editor */}
        <AnimatePresence>
          {showEditor && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="gold-border-glow">
                <CardHeader>
                  <CardTitle className="text-lg">Tạo bài mới</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Type selector */}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={form.type === "article" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setForm({ ...form, type: "article" })}
                        className={form.type === "article" ? "bg-gold text-black hover:bg-gold/90" : ""}
                      >
                        <BookOpen className="h-4 w-4 mr-1" /> Bài viết
                      </Button>
                      <Button
                        type="button"
                        variant={form.type === "podcast" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setForm({ ...form, type: "podcast" })}
                        className={form.type === "podcast" ? "bg-gold text-black hover:bg-gold/90" : ""}
                      >
                        <Mic className="h-4 w-4 mr-1" /> Podcast
                      </Button>
                    </div>

                    {/* Title */}
                    <Input
                      placeholder="Tiêu đề bài viết..."
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                    />

                    {/* Cover image */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <ImagePlus className="h-4 w-4" /> Hình ảnh bìa
                      </label>
                      <Input
                        placeholder="Dán URL hình ảnh hoặc chọn file..."
                        value={form.cover_url}
                        onChange={(e) => handleImageUrl(e.target.value)}
                      />
                      {/* File input for upload */}
                      <div className="flex items-center gap-3">
                        <label className="cursor-pointer px-4 py-2 rounded-lg border border-dashed border-border hover:border-gold/50 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                          <ImagePlus className="h-4 w-4" />
                          Chọn ảnh từ máy
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const url = URL.createObjectURL(file);
                                handleImageUrl(url);
                              }
                            }}
                          />
                        </label>
                        {imagePreview && (
                          <span className="text-xs text-emerald-500">Đã có ảnh</span>
                        )}
                      </div>
                      {/* Preview */}
                      {imagePreview && (
                        <div className="relative aspect-[2/1] rounded-lg overflow-hidden bg-muted max-w-md">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setForm({ ...form, cover_url: "" });
                              setImagePreview("");
                            }}
                            className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Summary */}
                    <Input
                      placeholder="Tóm tắt ngắn (hiển thị ở thumbnail)..."
                      value={form.summary}
                      onChange={(e) => setForm({ ...form, summary: e.target.value })}
                      required
                    />

                    {/* Content */}
                    <textarea
                      placeholder="Nội dung bài viết... (hỗ trợ **bold**, xuống dòng)"
                      value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                      required
                      rows={10}
                      className="w-full rounded-lg border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50 resize-y"
                    />

                    {/* Actions */}
                    <div className="flex gap-3 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          console.log("Save as draft:", form);
                          setShowEditor(false);
                        }}
                      >
                        <EyeOff className="h-4 w-4 mr-1" /> Lưu nháp
                      </Button>
                      <Button
                        type="submit"
                        className="bg-gold hover:bg-gold/90 text-black font-semibold"
                      >
                        <Eye className="h-4 w-4 mr-1" /> Đăng bài
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Posts list */}
        <motion.div variants={item} className="space-y-3">
          {posts.map((post, i) => {
            const author = users.find((u) => u.id === post.author_id);
            const commentCount = getCommentsByPost(post.id).length;

            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
              >
                <Card className={!post.published ? "opacity-60" : ""}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-4">
                      {/* Thumbnail */}
                      <div className="w-20 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                        <img
                          src={post.cover_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground text-sm">
                            {post.title}
                          </h3>
                          <Badge
                            variant="outline"
                            className={
                              post.type === "podcast"
                                ? "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30"
                                : "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
                            }
                          >
                            {post.type === "podcast" ? "Podcast" : "Bài viết"}
                          </Badge>
                          {!post.published && (
                            <Badge
                              variant="outline"
                              className="bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30"
                            >
                              Nháp
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(post.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" /> {post.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" /> {commentCount}
                          </span>
                          <span>{author?.full_name ?? "ROVA"}</span>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-muted-foreground hover:text-gold"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </PageTransition>
  );
}
