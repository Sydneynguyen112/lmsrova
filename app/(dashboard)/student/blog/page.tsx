"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sprout,
  Heart,
  MessageCircle,
  ArrowLeft,
  Calendar,
  Send,
  Mic,
  BookOpen,
} from "lucide-react";
import { getPublishedPosts, getCommentsByPost, users } from "@/lib/mock-data";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { useCurrentUser } from "@/lib/auth";
import { PageTransition } from "@/components/shared/PageTransition";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function StudentBlogPage() {
  const posts = getPublishedPosts();
  const currentUser = useCurrentUser("student");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [commentText, setCommentText] = useState("");

  const selectedPost = posts.find((p) => p.id === selectedPostId);
  const comments = selectedPostId ? getCommentsByPost(selectedPostId) : [];

  const toggleLike = (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    console.log("New comment:", { post_id: selectedPostId, content: commentText });
    setCommentText("");
  };

  return (
    <PageTransition>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        <motion.div variants={item}>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Sprout className="h-7 w-7 text-gold" />
            <span className="gold-gradient-text">Vườn ươm tâm thức</span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Bài viết & Podcast giúp bạn phát triển tư duy Trading
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {selectedPost ? (
            /* ─── Detail view ─── */
            <motion.div
              key={selectedPost.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <button
                onClick={() => setSelectedPostId(null)}
                className="flex items-center gap-2 text-sm text-gold hover:underline"
              >
                <ArrowLeft className="h-4 w-4" /> Quay lại
              </button>

              {/* Cover */}
              <div className="relative aspect-[2/1] rounded-xl overflow-hidden bg-muted">
                <img
                  src={selectedPost.cover_url}
                  alt={selectedPost.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <Badge
                    variant="outline"
                    className={
                      selectedPost.type === "podcast"
                        ? "bg-purple-500/30 text-white border-purple-400/50 mb-2"
                        : "bg-blue-500/30 text-white border-blue-400/50 mb-2"
                    }
                  >
                    {selectedPost.type === "podcast" ? (
                      <><Mic className="h-3 w-3 mr-1" /> Podcast</>
                    ) : (
                      <><BookOpen className="h-3 w-3 mr-1" /> Bài viết</>
                    )}
                  </Badge>
                  <h2 className="text-xl md:text-2xl font-bold text-white">
                    {selectedPost.title}
                  </h2>
                </div>
              </div>

              {/* Meta + Like */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(selectedPost.created_at)}
                  <span>•</span>
                  {users.find((u) => u.id === selectedPost.author_id)?.full_name ?? "ROVA"}
                </div>
                <button
                  onClick={(e) => toggleLike(selectedPost.id, e)}
                  className="flex items-center gap-1.5 text-sm transition-colors"
                >
                  <Heart
                    className={`h-5 w-5 transition-all ${
                      likedPosts.has(selectedPost.id)
                        ? "fill-red-500 text-red-500 scale-110"
                        : "text-muted-foreground hover:text-red-400"
                    }`}
                  />
                  <span className="text-muted-foreground">
                    {selectedPost.likes + (likedPosts.has(selectedPost.id) ? 1 : 0)}
                  </span>
                </button>
              </div>

              {/* Content */}
              <Card>
                <CardContent className="pt-5">
                  <div className="text-foreground/90 leading-relaxed whitespace-pre-line text-sm">
                    {selectedPost.content}
                  </div>
                </CardContent>
              </Card>

              {/* Comments */}
              <Card>
                <CardContent className="pt-5 space-y-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Bình luận ({comments.length})
                  </h3>

                  {comments.length > 0 && (
                    <div className="space-y-3">
                      {comments.map((comment) => {
                        const commenter = users.find((u) => u.id === comment.user_id);
                        const initials = commenter
                          ? commenter.full_name.split(" ").map((n) => n[0]).join("").slice(-2)
                          : "?";
                        return (
                          <div key={comment.id} className="flex gap-3">
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarFallback className="bg-gold/15 text-gold text-[10px]">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground">
                                  {commenter?.full_name ?? "Học viên"}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {formatRelativeTime(comment.created_at)}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Comment input */}
                  <form onSubmit={handleComment} className="flex gap-2">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-gold/15 text-gold text-[10px]">
                        {currentUser
                          ? currentUser.full_name.split(" ").map((n) => n[0]).join("").slice(-2)
                          : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        placeholder="Viết bình luận..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        disabled={!commentText.trim()}
                        className="bg-gold hover:bg-gold/90 text-black"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            /* ─── Gallery grid ─── */
            <motion.div
              key="gallery"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {posts.map((post) => {
                const commentCount = getCommentsByPost(post.id).length;
                const isLiked = likedPosts.has(post.id);

                return (
                  <motion.div
                    key={post.id}
                    variants={item}
                    whileHover={{ y: -3 }}
                    className="cursor-pointer group"
                    onClick={() => setSelectedPostId(post.id)}
                  >
                    <Card className="overflow-hidden hover:border-gold/40 transition-all h-full flex flex-col">
                      {/* Thumbnail */}
                      <div className="relative aspect-[3/2] overflow-hidden bg-muted">
                        <img
                          src={post.cover_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        {/* Type badge */}
                        <Badge
                          variant="outline"
                          className={`absolute top-3 left-3 text-[10px] ${
                            post.type === "podcast"
                              ? "bg-purple-500/30 text-white border-purple-400/50"
                              : "bg-blue-500/30 text-white border-blue-400/50"
                          }`}
                        >
                          {post.type === "podcast" ? (
                            <><Mic className="h-3 w-3 mr-1" /> Podcast</>
                          ) : (
                            <><BookOpen className="h-3 w-3 mr-1" /> Bài viết</>
                          )}
                        </Badge>
                        {/* Title overlay */}
                        <div className="absolute bottom-3 left-3 right-3">
                          <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2 drop-shadow-md">
                            {post.title}
                          </h3>
                        </div>
                      </div>

                      {/* Bottom bar */}
                      <CardContent className="py-3 px-4 flex items-center justify-between mt-auto">
                        <span className="text-[11px] text-muted-foreground">
                          {formatDate(post.created_at)}
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => toggleLike(post.id, e)}
                            className="flex items-center gap-1 text-xs transition-colors"
                          >
                            <Heart
                              className={`h-3.5 w-3.5 ${
                                isLiked
                                  ? "fill-red-500 text-red-500"
                                  : "text-muted-foreground"
                              }`}
                            />
                            <span className="text-muted-foreground">
                              {post.likes + (isLiked ? 1 : 0)}
                            </span>
                          </button>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MessageCircle className="h-3.5 w-3.5" />
                            {commentCount}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </PageTransition>
  );
}
