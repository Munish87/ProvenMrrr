"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { createPortal } from "react-dom";
import {
  ArrowBigUp,
  Bookmark,
  ChevronRight,
  Flame,
  ImagePlus,
  MessageCircle,
  MessageSquarePlus,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  Trash2,
  X,
} from "lucide-react";

type Comment = {
  id: string;
  authorId?: string;
  author: string;
  role: string;
  time: string;
  text: string;
  upvotes: number;
  hasUpvoted?: boolean;
  avatarUrl?: string | null;
  replies?: Comment[];
};

type Post = {
  id: string;
  authorId?: string;
  createdAt?: string;
  founder: string;
  startup: string;
  startupId?: string;
  time: string;
  text: string;
  tags: string[];
  upvotes: number;
  comments: number;
  saved: boolean;
  avatar: string;
  avatarUrl?: string | null;
  image?: string;
  discussionPrompt?: string;
  thread: Comment[];
  startupSlug?: string | null;
};

type PostRow = {
  id: string;
  user_id: string;
  content: string;
  tags: string[] | null;
  startup: string | null;
  image_url: string | null;
  discussion_prompt: string | null;
  created_at: string;
  users?: {
    name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
};

type CommentRow = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  users?: {
    name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
};

type UpvoteRow = {
  post_id: string;
  user_id: string;
};

type CommentUpvoteRow = {
  comment_id: string;
  user_id: string;
};

type StartupRow = {
  id: string;
  name: string;
  slug: string | null;
};

const INITIAL_POSTS: Post[] = [
  {
    id: "post-1",
    founder: "Menny",
    startup: "Hungryfilmcreator",
    time: "12 min ago",
    text: "Just hit $2k MRR after 3 months. I'm considering whether to share my revenue screenshots publicly. On one hand, it build trust. On the other, it might attract copycats. What do you think?",
    tags: ["Build in Public", "Growth", "Transparency"],
    upvotes: 88,
    comments: 26,
    saved: true,
    avatar: "M",
    image: "MRR dashboard snapshot",
    discussionPrompt: "Should founders post revenue screenshots?",
    thread: [
      {
        id: "c-1",
        author: "Aarav",
        role: "Founder, DevFlow",
        time: "8 min ago",
        text: "Transparency usually wins. I've found it helps closing deals with bigger clients who care about stability.",
        upvotes: 8,
      },
    ],
  },
  {
    id: "post-2",
    founder: "Sara Kim",
    startup: "Looplane",
    time: "37 min ago",
    text: "Tried TikTok ads but the quality was low. Now exploring organic LinkedIn content. Has anyone found the ultimate marketing strategy for AI SaaS in 2025?",
    tags: ["Marketing", "Growth", "AI SaaS"],
    upvotes: 182,
    comments: 64,
    saved: false,
    avatar: "S",
    thread: [
      {
        id: "c-2",
        author: "Nathan",
        role: "Founder, PipeLaunch",
        time: "20 min ago",
        text: "Story-led video content on LinkedIn is the current meta. We've seen high conversion there.",
        upvotes: 6,
      },
    ],
  },
  {
    id: "post-3",
    founder: "Jordan Lee",
    startup: "PromptDeck",
    time: "1 hr ago",
    text: "We just reached our first 50 users purely through Reddit. Looking for advice on how to scale that to the first 100 customers without paid spend.",
    tags: ["Acquisition", "Bootstrapping", "Growth"],
    upvotes: 144,
    comments: 48,
    saved: false,
    avatar: "J",
    image: "Product preview",
    thread: [
      {
        id: "c-3",
        author: "Ritika",
        role: "Founder, DeskPilot",
        time: "35 min ago",
        text: "Product Hunt is your next logical step. If you've got momentum from Reddit, PH will amplify it.",
        upvotes: 11,
      },
    ],
  },
  {
    id: "post-4",
    founder: "Anika Patel",
    startup: "RevenueCanvas",
    time: "2 hrs ago",
    text: "Deciding between Stripe and LemonSqueezy for our global rollout. Stripe has better APIs, but LS handles sales tax. Which one are you using?",
    tags: ["Payments", "SaaS", "Operations"],
    upvotes: 126,
    comments: 71,
    saved: true,
    avatar: "A",
    thread: [
      {
        id: "c-4",
        author: "Leo",
        role: "Founder, TallyForge",
        time: "70 min ago",
        text: "If you're in the EU, LS is a lifesaver for VAT. Otherwise, Stripe is faster to build with.",
        upvotes: 5,
      },
    ],
  },
  {
    id: "post-5",
    founder: "Diego Ruiz",
    startup: "SignalNest",
    time: "4 hrs ago",
    text: "Shared our churn analysis with customers and unexpectedly got 6 replies with feature ideas. Transparency is becoming our best retention tool.",
    tags: ["Retention", "Community", "Growth"],
    upvotes: 29,
    comments: 7,
    saved: false,
    avatar: "D",
    thread: [],
  },
  {
    id: "post-6",
    founder: "Priya Nair",
    startup: "MetricMint",
    time: "6 hrs ago",
    text: "Posting our weekly build log publicly again. It keeps the team honest and gives us an easy reason to reach out to old users.",
    tags: ["Build in Public", "Operations", "Bootstrapping"],
    upvotes: 18,
    comments: 5,
    saved: false,
    avatar: "P",
    thread: [],
  },
];

const BUILD_UPDATES = [
  { startup: "AI Writer", founder: "Sara Kim", milestone: "Reached $5k MRR" },
  { startup: "DevTool", founder: "Nathan Cole", milestone: "Launched on Product Hunt" },
  { startup: "Marketing SaaS", founder: "Aarav Singh", milestone: "Crossed 1,000 users" },
  { startup: "Looplane", founder: "Mia Torres", milestone: "Added annual pricing and 14 upgrades" },
];

const TRENDING_DISCUSSIONS = [
  { title: "Best marketing strategy for AI SaaS?", comments: 64, upvotes: 182, category: "Growth", postId: "post-2" },
  { title: "How to reach first 100 customers?", comments: 48, upvotes: 144, category: "Acquisition", postId: "post-3" },
  { title: "Stripe vs LemonSqueezy", comments: 71, upvotes: 126, category: "Payments", postId: "post-4" },
  { title: "Should founders post revenue screenshots?", comments: 26, upvotes: 88, category: "Build in Public", postId: "post-1" },
];

const LEADERBOARD = [
  { founder: "Menny", startup: "Hungryfilmcreator", points: 320, avatar: "M" },
  { founder: "Sara Kim", startup: "Looplane", points: 280, avatar: "S" },
  { founder: "Jordan Lee", startup: "PromptDeck", points: 236, avatar: "J" },
  { founder: "Anika Patel", startup: "RevenueCanvas", points: 198, avatar: "A" },
];

const TAGS = ["AI SaaS", "Bootstrapping", "Marketing", "Growth", "Product Hunt", "Build in Public"];
const STARTUP_OPTIONS_FALLBACK = ["None"];

function CommunityAvatar({ label, src }: { label: string; src?: string | null }) {
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: src ? "transparent" : "linear-gradient(135deg, rgba(126,161,255,0.95), rgba(92,108,255,0.82))",
        overflow: "hidden",
        position: "relative",
        color: "#f8fbff",
        fontSize: 16,
        fontWeight: 800,
        boxShadow: "0 12px 26px rgba(78, 95, 255, 0.24), inset 0 1px 0 rgba(255,255,255,0.24)",
        flexShrink: 0,
      }}
    >
      {src ? (
        <img src={src} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        label
      )}
    </div>
  );
}

function ThreadedComment({ 
  comment, 
  depth = 0, 
  onUpvote, 
  onReply, 
  onAddReply,
  replyText = "",
  setReplyText,
  activeReplyId,
  isLoggedIn,
  currentUserAvatar,
  currentUserAvatarUrl
}: { 
  comment: Comment; 
  depth?: number;
  onUpvote?: (id: string) => void;
  onReply?: (id: string) => void;
  onAddReply?: (commentId: string) => void;
  replyText?: string;
  setReplyText?: (text: string) => void;
  activeReplyId?: string | null;
  isLoggedIn?: boolean;
  currentUserAvatar?: string;
  currentUserAvatarUrl?: string | null;
}) {
  const isReplying = activeReplyId === comment.id;

  return (
    <div
      style={{
        marginLeft: depth ? 18 : 0,
        paddingLeft: depth ? 16 : 0,
        borderLeft: depth ? "1px solid rgba(224, 232, 239, 0.12)" : "none",
        marginTop: depth ? 8 : 12,
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderRadius: 18,
          background:
            "linear-gradient(180deg, rgba(214,223,230,0.06), rgba(96,103,109,0.03) 18%, rgba(15,16,18,0.72) 62%, rgba(10,11,12,0.9))",
          border: "1px solid rgba(224, 232, 239, 0.1)",
          marginBottom: depth > 0 ? 8 : 10,
        }}
      >
        <div style={{ display: "flex", gap: 12, marginBottom: 8, alignItems: "center" }}>
          <CommunityAvatar label={(comment.author?.[0] ?? "Y").toUpperCase()} src={comment.avatarUrl} />
          <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>{comment.author}</div>
              <div style={{ fontSize: 11, color: "var(--color-secondary)" }}>Independent founder</div>
            </div>
            <div style={{ fontSize: 11, color: "var(--color-muted)", whiteSpace: "nowrap" }}>{comment.time}</div>
          </div>
        </div>
        <p style={{ fontSize: 14, color: "var(--color-secondary)", lineHeight: 1.65, marginLeft: 0 }}>{comment.text}</p>
        
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
          <button 
            onClick={() => onUpvote?.(comment.id)}
            disabled={!isLoggedIn}
            style={{
              background: "transparent",
              border: "none",
              cursor: isLoggedIn ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              fontWeight: 700,
              color: comment.hasUpvoted ? "var(--color-accent)" : "var(--color-secondary)",
              padding: 0,
              opacity: isLoggedIn ? 1 : 0.6,
              transition: "all 0.2s"
            }}
          >
            <ArrowBigUp size={16} fill={comment.hasUpvoted ? "currentColor" : "none"} />
            {comment.upvotes} {comment.upvotes === 1 ? "upvote" : "upvotes"}
          </button>

          <button 
            onClick={() => onReply?.(comment.id)}
            disabled={!isLoggedIn}
            style={{
              background: "transparent",
              border: "none",
              cursor: isLoggedIn ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
              color: isReplying ? "var(--color-accent)" : "var(--color-secondary)",
              padding: 0,
              opacity: isLoggedIn ? 1 : 0.6,
              transition: "all 0.2s"
            }}
          >
            <MessageCircle size={14} />
            Reply
          </button>
        </div>
      </div>

      {isReplying && (
        <div className="glass" style={{ padding: 12, borderRadius: 18, marginBottom: 12, marginLeft: 16 }}>
           <div style={{ display: "flex", gap: 10 }}>
             <CommunityAvatar label={currentUserAvatar || "Y"} src={currentUserAvatarUrl} />
             <div style={{ flex: 1 }}>
                <textarea
                  autoFocus
                  className="field-input"
                  placeholder="Write a reply..."
                  style={{ minHeight: 60, fontSize: 13 }}
                  value={replyText}
                  onChange={(e) => setReplyText?.(e.target.value)}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => onReply?.("")}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-primary btn-sm"
                    disabled={!replyText.trim()}
                    onClick={() => onAddReply?.(comment.id)}
                  >
                    Post Reply
                  </button>
                </div>
             </div>
           </div>
        </div>
      )}

      {comment.replies?.map((reply) => (
        <ThreadedComment 
          key={reply.id} 
          comment={reply} 
          depth={depth + 1}
          onUpvote={onUpvote}
          onReply={onReply}
          onAddReply={onAddReply}
          replyText={activeReplyId === reply.id ? replyText : ""}
          setReplyText={setReplyText}
          activeReplyId={activeReplyId}
          isLoggedIn={isLoggedIn}
          currentUserAvatar={currentUserAvatar}
          currentUserAvatarUrl={currentUserAvatarUrl}
        />
      ))}
    </div>
  );
}

export function FounderCommunityPage({
  totalFounders,
  totalStartups,
  userStartups = [],
  currentUser,
}: {
  totalFounders: number;
  totalStartups: number;
  userStartups?: string[];
  currentUser?: {
    id: string;
    email: string | null;
    name: string | null;
    avatarUrl: string | null;
  } | null;
}) {
  const STARTUP_OPTIONS = useMemo(() => ["None", ...userStartups], [userStartups]);
  function getAvatarLabel(url: string | null | undefined, nameLabel: string) {
    if (url) return ""; // Image will be used
    return nameLabel[0]?.toUpperCase() || "F";
  }

  const [posts, setPosts] = useState<Post[]>([]);
  const [visibleCount, setVisibleCount] = useState(4);
  const [postMode, setPostMode] = useState<"update" | "discussion" | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [menuPostId, setMenuPostId] = useState<string | null>(null);
  const [draftContent, setDraftContent] = useState("");
  const [draftTag, setDraftTag] = useState("Growth");
  const [draftStartup, setDraftStartup] = useState(STARTUP_OPTIONS[0]);
  const [draftImage, setDraftImage] = useState<string | null>(null);
  const [draftImageName, setDraftImageName] = useState("");
  const [draftError, setDraftError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [userUpvotes, setUserUpvotes] = useState<Set<string>>(new Set());
  const [userCommentUpvotes, setUserCommentUpvotes] = useState<Set<string>>(new Set());
  const [isMounted, setIsMounted] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [activeReplyCommentId, setActiveReplyCommentId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const supabase = createClient() as any;
  const userLookupRef = useRef<Record<string, { name: string | null; email: string | null; avatar_url: string | null }>>({});
  const startupLookupRef = useRef<Record<string, { id: string; slug: string | null }>>({});
  const isLoggedIn = Boolean(currentUser?.id);
  const displayName = currentUser?.name || (currentUser?.email ? currentUser.email.split("@")[0] : "You");
  const displayAvatar = (displayName?.[0] ?? "Y").toUpperCase();
  const displayAvatarUrl = currentUser?.avatarUrl;

  const visiblePosts = useMemo(() => posts.slice(0, visibleCount), [posts, visibleCount]);

  const trendingDiscussions = useMemo(() => {
    const sorted = [...posts].sort((a, b) => b.upvotes - a.upvotes);
    return sorted.slice(0, 4).map((post) => ({
      title: truncateText(post.discussionPrompt || post.text, 64),
      comments: post.comments,
      upvotes: post.upvotes,
      category: post.tags[0] ?? "General",
      postId: post.id,
    }));
  }, [posts]);

  const authorIdMap = useMemo(() => {
    const map = new Map<string, string>();
    posts.forEach(p => {
      if (p.authorId) map.set(p.founder, p.authorId);
    });
    return map;
  }, [posts]);

  const postsToday = useMemo(() => {
    const today = new Date().toDateString();
    return posts.filter((post) => post.createdAt && new Date(post.createdAt).toDateString() === today).length;
  }, [posts]);

  const leaderboardItems = useMemo(() => {
    const grouped = new Map<string, { founder: string; startup: string; startupId?: string; startupSlug?: string | null; points: number; avatar: string; avatarUrl?: string | null; bestPostUpvotes: number }>();

    posts.forEach((post) => {
      const key = post.authorId ?? `${post.founder}:${post.startup}`;
      const existing = grouped.get(key);

      if (!existing) {
        grouped.set(key, {
          founder: post.founder,
          startup: post.startup,
          startupId: post.startupId,
          startupSlug: post.startupSlug,
          points: post.upvotes,
          avatar: post.avatar,
          avatarUrl: post.avatarUrl,
          bestPostUpvotes: post.upvotes,
        });
        return;
      }

      existing.points += post.upvotes;
      if (post.upvotes >= existing.bestPostUpvotes) {
        existing.startup = post.startup;
        existing.startupId = post.startupId;
        existing.startupSlug = post.startupSlug;
        existing.avatar = post.avatar;
        existing.avatarUrl = post.avatarUrl;
        existing.bestPostUpvotes = post.upvotes;
      }
    });

    return Array.from(grouped.values())
      .map((item, idx) => ({ ...item, authorId: posts.find(p => p.founder === item.founder)?.authorId }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 4);
  }, [posts]);

  const buildUpdates = useMemo(() => {
    return posts
      .filter((post) => post.tags.includes("Build in Public"))
      .slice(0, 4)
      .map((post) => ({
        startup: post.startup,
        founder: post.founder,
        startupId: post.startupId,
        milestone: truncateText(post.discussionPrompt || post.text, 78),
        postId: post.id,
      }));
  }, [posts]);

  function truncateText(text: string | null | undefined, maxLength: number) {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 3)}...`;
  }

  function formatTimeLabel(value: string) {
    return formatDistanceToNow(new Date(value), { addSuffix: true });
  }

  function getUserLabel(userId: string | null, name?: string | null, email?: string | null) {
    if (userId && currentUser?.id && userId === currentUser.id) {
      if (currentUser.name) return currentUser.name;
      if (currentUser.email) return currentUser.email.split("@")[0];
      return "You";
    }
    if (name) return name;
    if (email) return email.split("@")[0];
    return "Founder";
  }

  async function attachStartupIds(inputPosts: Post[]) {
    const startupNames = Array.from(
      new Set(inputPosts.map((post) => post.startup).filter((name) => name && name !== "Independent founder"))
    );

    if (!startupNames.length) {
      startupLookupRef.current = {};
      return inputPosts;
    }

    const { data: startupRows } = await supabase
      .from("startups")
      .select("id, name, slug")
      .in("name", startupNames);

    const lookup = ((startupRows ?? []) as StartupRow[]).reduce<Record<string, { id: string; slug: string | null }>>((acc, startup) => {
      acc[startup.name] = { id: startup.id, slug: startup.slug };
      return acc;
    }, {});

    startupLookupRef.current = lookup;

    return inputPosts.map((post) => ({
      ...post,
      startupId: lookup[post.startup]?.id,
      startupSlug: lookup[post.startup]?.slug,
    }));
  }


  async function ensureCurrentUserProfile() {
    if (!currentUser?.id) return { ok: false as const, message: "Sign in to continue." };

    const response = await fetch("/api/community/ensure-profile", { method: "POST" });
    const result = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };

    if (!response.ok) {
      return { ok: false as const, message: result.error ?? "Unable to prepare your profile." };
    }

    return { ok: true as const };
  }

  async function loadCommunity(isAppend: boolean = false) {
    setIsLoading(true);

    const start = isAppend ? posts.length : 0;
    const end = start + 19; // Fetch 20 posts

    // 1. Fetch posts with range
    const { data: postRows, error: postError } = await supabase
      .from("community_posts")
      .select("*, users:users!community_posts_user_id_fkey(name, email, avatar_url)")
      .order("created_at", { ascending: false })
      .range(start, end);

    if (postError) {
      console.error("Posts fetch error:", postError);
      const errorDetail = postError.message || postError.details || postError.hint || "Unknown fetch error";
      setDraftError(`Failed to load posts: ${errorDetail} (${JSON.stringify(postError)})`);
      setIsLoading(false);
      return;
    }

    const currentPostIds = (postRows || []).map((p: any) => p.id);
    
    // If no posts, we are done
    if (currentPostIds.length === 0) {
      setIsLoading(false);
      setHasMore(false);
      return;
    }

    // 2. Fetch only relevant comments and upvotes for these specific posts
    const [commentRes, upvoteRes] = await Promise.all([
      supabase
        .from("community_comments")
        .select("*, users:users!community_comments_user_id_fkey(name, email, avatar_url)")
        .in("post_id", currentPostIds),
      supabase
        .from("community_post_upvotes")
        .select("post_id, user_id")
        .in("post_id", currentPostIds)
    ]);

    if (commentRes.error) console.error("Comments fetch error:", commentRes.error);
    if (upvoteRes.error) console.warn("Upvotes fetch error:", upvoteRes.error);

    const commentRows = (commentRes.data || []) as CommentRow[];
    const upvoteRows = (upvoteRes.data || []) as UpvoteRow[];
    const currentCommentIds = commentRows.map(c => c.id);

    // 3. Fetch upvotes ONLY for these comments
    let commentUpvoteRows: CommentUpvoteRow[] = [];
    if (currentCommentIds.length > 0) {
      const { data: cUpvotes, error: cUpvoteError } = await supabase
        .from("community_comment_upvotes")
        .select("comment_id, user_id")
        .in("comment_id", currentCommentIds);
      
      if (cUpvoteError) console.warn("Comment upvotes fetch error:", cUpvoteError);
      else commentUpvoteRows = (cUpvotes || []) as CommentUpvoteRow[];
    }

    const userLookup: Record<string, { name: string | null; email: string | null; avatar_url: string | null }> = { ...userLookupRef.current };
    const commentUpvoteCounts: Record<string, number> = {};
    const commentUpvotedSet = new Set<string>();
    
    // Process upvotes for comments
    commentUpvoteRows.forEach((vote) => {
      commentUpvoteCounts[vote.comment_id] = (commentUpvoteCounts[vote.comment_id] ?? 0) + 1;
      if (currentUser?.id && vote.user_id === currentUser.id) {
        commentUpvotedSet.add(vote.comment_id);
      }
    });

    const commentsByPost: Record<string, Comment[]> = {};
    const allComments: Record<string, Comment> = {};
    const childComments: CommentRow[] = [];

    ((commentRows ?? []) as CommentRow[]).forEach((comment: CommentRow) => {
      const isMe = currentUser?.id && comment.user_id === currentUser.id;
      userLookup[comment.user_id] = {
        name: (isMe ? currentUser.name : null) ?? comment.users?.name ?? userLookup[comment.user_id]?.name ?? null,
        email: (isMe ? currentUser.email : null) ?? comment.users?.email ?? userLookup[comment.user_id]?.email ?? null,
        avatar_url: (isMe ? currentUser.avatarUrl : null) ?? comment.users?.avatar_url ?? userLookup[comment.user_id]?.avatar_url ?? null,
      };
      const authorLabel = getUserLabel(comment.user_id, comment.users?.name ?? null, comment.users?.email ?? null);
      const resAvatarUrl = userLookup[comment.user_id].avatar_url;
      const newComment: Comment = {
        id: comment.id,
        authorId: comment.user_id,
        author: authorLabel,
        role: "Independent founder",
        time: formatTimeLabel(comment.created_at),
        text: comment.content,
        upvotes: commentUpvoteCounts[comment.id] ?? 0,
        hasUpvoted: commentUpvotedSet.has(comment.id),
        avatarUrl: resAvatarUrl,
        replies: [],
      };
      
      allComments[comment.id] = newComment;
      if (comment.parent_id) {
        childComments.push(comment);
      } else {
        commentsByPost[comment.post_id] = [newComment, ...(commentsByPost[comment.post_id] ?? [])];
      }
    });

    // Nest children
    childComments.forEach(child => {
      const parent = allComments[child.parent_id!];
      const me = allComments[child.id];
      if (parent && me) {
        parent.replies = [...(parent.replies ?? []), me];
      }
    });

    const upvoteCounts: Record<string, number> = {};
    const upvotedSet = new Set<string>();
    ((upvoteRows ?? []) as UpvoteRow[]).forEach((vote: UpvoteRow) => {
      upvoteCounts[vote.post_id] = (upvoteCounts[vote.post_id] ?? 0) + 1;
      if (currentUser?.id && vote.user_id === currentUser.id) {
        upvotedSet.add(vote.post_id);
      }
    });

    const mappedPosts = ((postRows ?? []) as PostRow[]).map((post: PostRow) => {
      const isMe = currentUser?.id && post.user_id === currentUser.id;
      userLookup[post.user_id] = {
        name: (isMe ? currentUser.name : null) ?? post.users?.name ?? userLookup[post.user_id]?.name ?? null,
        email: (isMe ? currentUser.email : null) ?? post.users?.email ?? userLookup[post.user_id]?.email ?? null,
        avatar_url: (isMe ? currentUser.avatarUrl : null) ?? post.users?.avatar_url ?? userLookup[post.user_id]?.avatar_url ?? null,
      };
      const authorLabel = getUserLabel(post.user_id, post.users?.name ?? null, post.users?.email ?? null);
      const resAvatarUrl = userLookup[post.user_id].avatar_url;
      const thread = commentsByPost[post.id] ?? [];
      return {
        id: post.id,
        authorId: post.user_id,
        createdAt: post.created_at,
        founder: authorLabel,
        startup: post.startup ?? "Independent founder",
        startupId: undefined,
        time: formatTimeLabel(post.created_at),
        text: post.content,
        tags: post.tags ?? [],
        upvotes: upvoteCounts[post.id] ?? 0,
        comments: thread.length,
        saved: false,
        avatar: getAvatarLabel(resAvatarUrl, authorLabel),
        avatarUrl: resAvatarUrl,
        image: post.image_url ?? undefined,
        discussionPrompt: post.discussion_prompt ?? undefined,
        thread,
      } as Post;
    });

    const postsWithStartupIds = await attachStartupIds(mappedPosts);

    userLookupRef.current = userLookup;
    setPosts((current) => isAppend ? [...current, ...postsWithStartupIds] : postsWithStartupIds);
    setVisibleCount((current) => isAppend ? current + postsWithStartupIds.length : Math.min(20, postsWithStartupIds.length || 20));
    setExpandedPostId((current) => current ?? postsWithStartupIds[0]?.id ?? null);
    if (!isAppend) {
      setUserUpvotes(upvotedSet);
      setUserCommentUpvotes(commentUpvotedSet);
    } else {
      setUserUpvotes(prev => new Set([...prev, ...upvotedSet]));
      setUserCommentUpvotes(prev => new Set([...prev, ...commentUpvotedSet]));
    }
    setHasMore(postRows.length === 20);
    setIsLoading(false);
  }

  useEffect(() => {
    setIsMounted(true);
    void loadCommunity();
  }, [currentUser?.id]);

  useEffect(() => {
    const channel = supabase
      .channel("community-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_posts" },
        (payload: any) => {
          const post = payload.new as {
            id: string;
            user_id: string;
            content: string;
            tags: string[] | null;
            startup: string | null;
            image_url: string | null;
            discussion_prompt: string | null;
            created_at: string;
          };

          setPosts((current) => {
            if (current.some((item) => item.id === post.id)) {
              return current;
            }
            const isMe = currentUser?.id && post.user_id === currentUser.id;
            const userData = userLookupRef.current[post.user_id] || (isMe ? { name: currentUser.name, email: currentUser.email, avatar_url: currentUser.avatarUrl } : null);
            const authorLabel = getUserLabel(post.user_id, userData?.name ?? null, userData?.email ?? null);
            const resAvatarUrl = userData?.avatar_url ?? null;
            
            const nextPost: Post = {
              id: post.id,
              authorId: post.user_id,
              createdAt: post.created_at,
              founder: authorLabel,
              startup: post.startup ?? "Independent founder",
              startupId: post.startup ? startupLookupRef.current[post.startup]?.id : undefined,
              startupSlug: post.startup ? startupLookupRef.current[post.startup]?.slug : undefined,
              time: formatTimeLabel(post.created_at),
              text: post.content,
              tags: post.tags ?? [],
              upvotes: 0,
              comments: 0,
              saved: false,
              avatar: getAvatarLabel(resAvatarUrl, authorLabel),
              avatarUrl: resAvatarUrl,
              image: post.image_url ?? undefined,
              discussionPrompt: post.discussion_prompt ?? undefined,
              thread: [],
            };
            return [nextPost, ...current];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "community_posts" },
        (payload: any) => {
          const post = payload.old as { id: string };
          setPosts((current) => current.filter((item) => item.id !== post.id));
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_comments" },
        (payload: any) => {
          const comment = payload.new as {
            id: string;
            post_id: string;
            user_id: string;
            parent_id: string | null;
            content: string;
            created_at: string;
          };

          const isMe = currentUser?.id && comment.user_id === currentUser.id;
          const userData = userLookupRef.current[comment.user_id] || (isMe ? { name: currentUser.name, email: currentUser.email, avatar_url: currentUser.avatarUrl } : null);
          const authorLabel = getUserLabel(comment.user_id, userData?.name ?? null, userData?.email ?? null);
          const resAvatarUrl = userData?.avatar_url ?? null;

          const newComment: Comment = {
            id: comment.id,
            authorId: comment.user_id,
            author: authorLabel,
            role: "Independent founder",
            time: formatTimeLabel(comment.created_at),
            text: comment.content,
            upvotes: 0,
            avatarUrl: resAvatarUrl,
            replies: [],
          };

          setPosts((current) =>
            current.map((post) => {
              if (post.id !== comment.post_id) return post;
              
              if (comment.parent_id) {
                const addToThread = (thread: Comment[]): Comment[] => {
                  return thread.map(c => {
                    if (c.id === comment.parent_id) {
                      if (c.replies?.some(r => r.id === comment.id)) return c;
                      return { ...c, replies: [newComment, ...(c.replies ?? [])] };
                    }
                    if (c.replies?.length) return { ...c, replies: addToThread(c.replies) };
                    return c;
                  });
                };
                return { ...post, thread: addToThread(post.thread), comments: post.comments + 1 };
              } else {
                if (post.thread.some((item) => item.id === comment.id)) return post;
                return {
                  ...post,
                  thread: [newComment, ...post.thread],
                  comments: post.comments + 1,
                };
              }
            })
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "community_comments" },
        (payload: any) => {
          const comment = payload.old as { id: string; post_id: string };
          setPosts((current) =>
            current.map((post) => {
              if (post.id !== comment.post_id) return post;
              const nextThread = post.thread.filter((item) => item.id !== comment.id);
              if (nextThread.length === post.thread.length) return post;
              return { ...post, thread: nextThread, comments: Math.max(0, post.comments - 1) };
            })
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_post_upvotes" },
        (payload: any) => {
          const upvote = payload.new as { post_id: string; user_id: string };
          setPosts((current) =>
            current.map((post) =>
              post.id === upvote.post_id ? { ...post, upvotes: post.upvotes + 1 } : post
            )
          );
          if (currentUser?.id && upvote.user_id === currentUser.id) {
            setUserUpvotes((prev) => new Set(prev).add(upvote.post_id));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "community_post_upvotes" },
        (payload: any) => {
          const upvote = payload.old as { post_id: string; user_id: string };
          setPosts((current) =>
            current.map((post) =>
              post.id === upvote.post_id ? { ...post, upvotes: Math.max(0, post.upvotes - 1) } : post
            )
          );
          if (currentUser?.id && upvote.user_id === currentUser.id) {
            setUserUpvotes((prev) => {
              const next = new Set(prev);
              next.delete(upvote.post_id);
              return next;
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_comment_upvotes" },
        (payload: any) => {
          const upvote = payload.new as { comment_id: string; user_id: string };
          setPosts((current) =>
            current.map((post) => {
              const updateThread = (thread: Comment[]): Comment[] => {
                return thread.map(c => {
                  if (c.id === upvote.comment_id) {
                    return { ...c, upvotes: c.upvotes + 1 };
                  }
                  if (c.replies?.length) {
                    return { ...c, replies: updateThread(c.replies) };
                  }
                  return c;
                });
              };
              return { ...post, thread: updateThread(post.thread) };
            })
          );
          if (currentUser?.id && upvote.user_id === currentUser.id) {
            setUserCommentUpvotes((prev) => new Set(prev).add(upvote.comment_id));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "community_comment_upvotes" },
        (payload: any) => {
          const upvote = payload.old as { comment_id: string; user_id: string };
          setPosts((current) =>
            current.map((post) => {
              const updateThread = (thread: Comment[]): Comment[] => {
                return thread.map(c => {
                  if (c.id === upvote.comment_id) {
                    return { ...c, upvotes: Math.max(0, c.upvotes - 1) };
                  }
                  if (c.replies?.length) {
                    return { ...c, replies: updateThread(c.replies) };
                  }
                  return c;
                });
              };
              return { ...post, thread: updateThread(post.thread) };
            })
          );
          if (currentUser?.id && upvote.user_id === currentUser.id) {
            setUserCommentUpvotes((prev) => {
              const next = new Set(prev);
              next.delete(upvote.comment_id);
              return next;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  function resetComposer() {
    setDraftContent("");
    setDraftTag("Growth");
    setDraftStartup(STARTUP_OPTIONS[0]);
    setDraftImage(null);
    setDraftImageName("");
    setDraftError("");
    setIsUploadingImage(false);
  }

  function closeComposer() {
    resetComposer();
    setPostMode(null);
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setDraftError("Please upload an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setDraftError("Screenshot must be 4 MB or smaller.");
      event.target.value = "";
      return;
    }

    setIsUploadingImage(true);
    setDraftError("");

    const reader = new FileReader();
    reader.onload = () => {
      setDraftImage(typeof reader.result === "string" ? reader.result : null);
      setDraftImageName(file.name);
      setIsUploadingImage(false);
    };
    reader.onerror = () => {
      setDraftError("Failed to read image file.");
      setIsUploadingImage(false);
    };
    reader.readAsDataURL(file);
  }

  function removeDraftImage() {
    setDraftImage(null);
    setDraftImageName("");
    setDraftError("");
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  }

    async function handleAddComment(postId: string, parentId?: string) {
    if (!currentUser?.id) return;
    const ensuredProfile = await ensureCurrentUserProfile();
    if (!ensuredProfile.ok) return;
    
    const text = parentId 
      ? (replyDrafts[parentId] ?? "").trim() 
      : (commentDrafts[postId] ?? "").trim();
      
    if (!text) return;

    const { data, error } = await supabase
      .from("community_comments")
      .insert({
        post_id: postId,
        user_id: currentUser.id,
        content: text,
        parent_id: parentId ?? null,
      })
      .select("id, post_id, user_id, content, created_at, parent_id")
      .single();

    if (error || !data) return;

    const newComment: Comment = {
      id: data.id,
      authorId: data.user_id,
      author: displayName,
      role: "Independent founder",
      time: formatTimeLabel(data.created_at),
      text: data.content,
      upvotes: 0,
      avatarUrl: currentUser.avatarUrl,
      replies: [],
    };

    setPosts((current) =>
      current.map((post) => {
        if (post.id !== postId) return post;
        
        if (parentId) {
          // Recursive search and append
          const addToThread = (thread: Comment[]): Comment[] => {
            return thread.map(c => {
               if (c.id === parentId) {
                 return { ...c, replies: [newComment, ...(c.replies ?? [])] };
               }
               if (c.replies?.length) {
                 return { ...c, replies: addToThread(c.replies) };
               }
               return c;
            });
          };
          return { ...post, thread: addToThread(post.thread), comments: post.comments + 1 };
        } else {
          if (post.thread.some((comment) => comment.id === newComment.id)) return post;
          return {
            ...post,
            thread: [newComment, ...post.thread],
            comments: post.comments + 1,
          };
        }
      })
    );

    if (parentId) {
      setReplyDrafts(prev => ({ ...prev, [parentId]: "" }));
      setActiveReplyCommentId(null);
    } else {
      setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
    }
  }

  async function handleToggleCommentUpvote(commentId: string) {
    if (!currentUser?.id) return;
    const ensuredProfile = await ensureCurrentUserProfile();
    if (!ensuredProfile.ok) return;

    if (userCommentUpvotes.has(commentId)) {
      const { error } = await supabase
        .from("community_comment_upvotes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", currentUser.id);

      if (!error) {
        await loadCommunity();
      }
      return;
    }

    const { error } = await supabase
      .from("community_comment_upvotes")
      .insert({ comment_id: commentId, user_id: currentUser.id });

    if (!error) {
      await loadCommunity();
    }
  }
  async function handlePublishPost() {
    if (!currentUser?.id) {
      setDraftError("Sign in to publish a post.");
      return;
    }
    const ensuredProfile = await ensureCurrentUserProfile();
    if (!ensuredProfile.ok) {
      setDraftError(ensuredProfile.message);
      return;
    }
    const content = draftContent.trim();
    if (!content) {
      setDraftError("Write something before publishing.");
      return;
    }

    const { data, error } = await supabase
      .from("community_posts")
      .insert({
        user_id: currentUser.id,
        content,
        tags: [draftTag],
        startup: draftStartup === "None" ? "Independent founder" : draftStartup,
        image_url: draftImage ?? null,
        discussion_prompt: postMode === "discussion" ? content : null,
      })
      .select("id, user_id, content, tags, startup, image_url, discussion_prompt, created_at")
      .single();

    if (error || !data) {
      setDraftError(error?.message ?? "Unable to publish post right now.");
      return;
    }

    const newPost: Post = {
      id: data.id,
      authorId: data.user_id,
      createdAt: data.created_at,
      founder: displayName,
      startup: data.startup ?? "Independent founder",
      time: formatTimeLabel(data.created_at),
      text: data.content,
      tags: data.tags ?? [draftTag],
      upvotes: 0,
      comments: 0,
      saved: false,
      avatar: getAvatarLabel(currentUser.avatarUrl, displayName),
      avatarUrl: currentUser.avatarUrl,
      image: data.image_url ?? undefined,
      discussionPrompt: data.discussion_prompt ?? undefined,
      thread: [],
    };

    setPosts((current) => {
      const next = current.some((post) => post.id === data.id) ? current : [newPost, ...current];
      setVisibleCount((count) => Math.max(count, Math.min(count + 1, next.length)));
      return next;
    });
    setExpandedPostId(newPost.id);
    closeComposer();
  }

  async function handleDeletePost(postId: string) {
    if (!currentUser?.id) return;

    const { error } = await supabase
      .from("community_posts")
      .delete()
      .eq("id", postId)
      .eq("user_id", currentUser.id);

    if (!error) {
      setMenuPostId(null);
      await loadCommunity();
    }
  }
  async function handleToggleUpvote(postId: string) {
    if (!currentUser?.id) return;

    const ensuredProfile = await ensureCurrentUserProfile();
    if (!ensuredProfile.ok) return;
    if (userUpvotes.has(postId)) {
      const { error } = await supabase
        .from("community_post_upvotes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", currentUser.id);

      if (!error) {
        await loadCommunity();
      }
      return;
    }

    const { error } = await supabase
      .from("community_post_upvotes")
      .insert({ post_id: postId, user_id: currentUser.id });

    if (!error) {
      await loadCommunity();
    }
  }
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="page-container" style={{ paddingTop: 94, paddingBottom: 152 }}>
      <section className="community-hero glass" style={{ padding: "44px 44px 32px", marginBottom: 28 }}>
        <div style={{ textAlign: "center", maxWidth: 1000, margin: "0 auto" }}>
          <div className="glass-pill" style={{ justifyContent: "center", width: "fit-content", margin: "0 auto 18px" }}>
            Where founders share real startup progress
          </div>
          <h1 style={{ fontSize: 54, lineHeight: 1.02, letterSpacing: "-0.05em", marginBottom: 16, fontWeight: 800 }}>
            Founder Community
          </h1>
          <p
            style={{
              fontSize: 20,
              lineHeight: 1.7,
              color: "var(--color-secondary)",
              maxWidth: 880,
              margin: "0 auto 28px",
            }}
          >
            A space for SaaS founders to share progress, discuss strategies, and learn from real startup journeys. Post updates, ask questions and follow builders growing their products.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              className="btn btn-primary"
              onClick={() => isLoggedIn && setPostMode("update")}
              disabled={!isLoggedIn}
              style={!isLoggedIn ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
            >
              <Plus size={18} />
              Create Post
            </button>
          </div>
          {!isLoggedIn && (
            <div style={{ marginTop: 10, fontSize: 13, color: "var(--color-secondary)" }}>
              Sign in to create a post.
            </div>
          )}
        </div>
      </section>

      <div className="community-layout">
        <main style={{ display: "grid", gap: 22 }}>
          <section className="glass" style={{ padding: 22 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 16,
                marginBottom: 18,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em" }}>Community Feed</div>
                <div style={{ fontSize: 14, color: "var(--color-secondary)", marginTop: 6 }}>
                  Founders posting updates, experiments, and questions in one stream.
                </div>
              </div>
              <div className="search-box" style={{ minWidth: 280, flex: "0 1 320px" }}>
                <Search size={18} color="var(--color-secondary)" />
                <input placeholder="Search posts, founders, or startups" />
              </div>
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              {visiblePosts.map((post) => {
                const isExpanded = expandedPostId === post.id;
                const canDelete = Boolean(currentUser?.id && post.authorId === currentUser.id);
                const hasUpvoted = userUpvotes.has(post.id);

                return (
                  <article key={post.id} id={post.id} className="glass" style={{ padding: 22, borderRadius: 24, scrollMarginTop: 120 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 16,
                        alignItems: "flex-start",
                        marginBottom: 16,
                      }}
                    >
                      <div style={{ display: "flex", gap: 14, minWidth: 0 }}>
                        <CommunityAvatar label={post.avatar} src={post.avatarUrl} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <span style={{ fontSize: 16, fontWeight: 800 }}>{post.founder}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              {post.startupId ? (
                                <Link
                                  href={`/startup/${post.startupSlug || post.startupId}`}
                                  style={{
                                    fontSize: 13,
                                    color: "var(--color-accent)",
                                    fontWeight: 700,
                                    textDecoration: "none",
                                    transition: "opacity 0.2s ease",
                                  }}
                                  onMouseOver={(e) => (e.currentTarget.style.opacity = "0.7")}
                                  onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
                                >
                                  {post.startup}
                                </Link>
                              ) : (
                                <span style={{ fontSize: 13, color: "var(--color-accent)", fontWeight: 700 }}>{post.startup}</span>
                              )}
                              <span style={{ fontSize: 12, color: "var(--color-muted)" }}>• {post.time}</span>
                            </div>
                          </div>
                          <div style={{ fontSize: 12, color: "var(--color-secondary)", marginTop: 4 }}>Founder update</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {canDelete && (
                          <div style={{ position: "relative" }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: "6px 8px" }}
                              onClick={() => setMenuPostId(menuPostId === post.id ? null : post.id)}
                              aria-label="Post actions"
                            >
                              <MoreHorizontal size={16} />
                            </button>
                            {menuPostId === post.id && (
                              <div
                                className="glass"
                                style={{
                                  position: "absolute",
                                  right: 0,
                                  top: "calc(100% + 8px)",
                                  padding: 8,
                                  borderRadius: 14,
                                  minWidth: 140,
                                  zIndex: 10,
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleDeletePost(post.id)}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    width: "100%",
                                    background: "none",
                                    border: "none",
                                    color: "#f87171",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    padding: "6px 8px",
                                    textAlign: "left",
                                  }}
                                >
                                  <Trash2 size={14} />
                                  Delete post
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        <button
                          className="btn btn-secondary"
                          style={{ padding: "8px 14px" }}
                          onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                        >
                          {isExpanded ? "Hide thread" : "Open post"}
                        </button>
                      </div>
                    </div>

                    <p style={{ fontSize: 15, lineHeight: 1.75, color: "var(--color-text)", marginBottom: 16 }}>{post.text}</p>

                    {post.image ? (
                      post.image.startsWith("data:image/") ? (
                        <div
                          style={{
                            borderRadius: 22,
                            border: "1px solid rgba(224, 232, 239, 0.12)",
                            overflow: "hidden",
                            marginBottom: 16,
                            background: "rgba(10, 14, 20, 0.82)",
                          }}
                        >
                          <img
                            src={post.image}
                            alt="Post screenshot"
                            style={{ display: "block", width: "100%", maxHeight: 320, objectFit: "cover" }}
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            borderRadius: 22,
                            border: "1px solid rgba(224, 232, 239, 0.12)",
                            minHeight: 170,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 16,
                            background:
                              "radial-gradient(circle at top left, rgba(91,124,255,0.22), transparent 28%), linear-gradient(180deg, rgba(214,223,230,0.08), rgba(96,103,109,0.04) 18%, rgba(18,20,24,0.88) 58%, rgba(12,13,16,0.94))",
                            color: "rgba(236, 241, 248, 0.78)",
                            fontSize: 14,
                            fontWeight: 600,
                          }}
                        >
                          {post.image}
                        </div>
                      )
                    ) : null}

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            padding: "7px 12px",
                            borderRadius: 999,
                            fontSize: 12,
                            color: "var(--color-secondary)",
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(224, 232, 239, 0.1)",
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        className="btn btn-secondary"
                        style={{
                          padding: "9px 14px",
                          borderColor: hasUpvoted ? "rgba(125,162,255,0.35)" : undefined,
                          color: hasUpvoted ? "var(--color-accent)" : undefined,
                          opacity: !isLoggedIn ? 0.7 : 1,
                        }}
                        onClick={() => void handleToggleUpvote(post.id)}
                        disabled={!isLoggedIn}
                      >
                        <ArrowBigUp size={16} />
                        {post.upvotes}
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: "9px 14px" }}
                        onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                      >
                        <MessageCircle size={16} />
                        {post.comments}
                      </button>
                      <button className="btn btn-secondary" style={{ padding: "9px 14px" }}>
                        <Bookmark size={16} />
                        {post.saved ? "Saved" : "Save"}
                      </button>
                    </div>

                    {isExpanded ? (
                      <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid rgba(224, 232, 239, 0.1)" }}>
                        {post.discussionPrompt ? (
                          <div className="glass" style={{ padding: 16, marginBottom: 14, borderRadius: 20 }}>
                            <div
                              style={{
                                fontSize: 12,
                                color: "var(--color-accent)",
                                fontWeight: 800,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                marginBottom: 6,
                              }}
                            >
                              Discussion Prompt
                            </div>
                            <div style={{ fontSize: 15, color: "var(--color-text)", lineHeight: 1.65 }}>
                              {post.discussionPrompt}
                            </div>
                          </div>
                        ) : null}

                        <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
                          {post.thread.length ? (
                            post.thread.map((comment) => (
                              <ThreadedComment 
                                key={comment.id} 
                                comment={comment} 
                                isLoggedIn={isLoggedIn}
                                currentUserAvatar={displayAvatar}
                                currentUserAvatarUrl={displayAvatarUrl}
                                onUpvote={handleToggleCommentUpvote}
                                onReply={(id) => setActiveReplyCommentId(id)}
                                activeReplyId={activeReplyCommentId}
                                replyText={replyDrafts[comment.id] || ""}
                                setReplyText={(text) => setReplyDrafts(prev => ({ ...prev, [comment.id]: text }))}
                                onAddReply={(commentId) => handleAddComment(post.id, commentId)}
                              />
                            ))
                          ) : (
                            <div style={{ fontSize: 14, color: "var(--color-secondary)" }}>
                              No comments yet. Start the discussion.
                            </div>
                          )}
                        </div>

                        <div className="glass" style={{ padding: 14, borderRadius: 20 }}>
                          <div style={{ fontSize: 13, color: "var(--color-secondary)", marginBottom: 10 }}>Add a comment</div>
                          <textarea
                            className="field-input"
                            placeholder="Share a suggestion, answer, or lesson learned..."
                            style={{ minHeight: 96 }}
                            value={commentDrafts[post.id] ?? ""}
                            onChange={(e) =>
                              setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                            }
                          />
                          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                            <button
                              className="btn btn-primary"
                              style={{ padding: "10px 16px", opacity: isLoggedIn && (commentDrafts[post.id] ?? "").trim() ? 1 : 0.55 }}
                              disabled={!isLoggedIn || !(commentDrafts[post.id] ?? "").trim()}
                              onClick={() => void handleAddComment(post.id)}
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}


              {hasMore && (
                <div style={{ textAlign: "center", paddingTop: 12, paddingBottom: 12 }}>
                  <button
                    className="btn btn-secondary"
                    style={{ 
                      margin: "0 auto", 
                      padding: "10px 24px", 
                      borderRadius: 14,
                      opacity: isLoading ? 0.6 : 1,
                      cursor: isLoading ? "wait" : "pointer"
                    }}
                    onClick={() => !isLoading && loadCommunity(true)}
                    disabled={isLoading}
                  >
                    {isLoading ? "Loading..." : "Load more updates"}
                  </button>
                </div>
              )}

              {!hasMore && posts.length > 0 && (
                <div style={{ textAlign: "center", fontSize: 13, color: "var(--color-secondary)", paddingTop: 24, paddingBottom: 12 }}>
                  You are all caught up for now.
                </div>
              )}
            </div>
          </section>

        </main>

        <aside style={{ display: "grid", gap: 22, alignSelf: "start" }}>
          <section className="glass" style={{ padding: 22 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Founder Leaderboard</h2>
            <div style={{ display: "grid", gap: 12 }}>
              {leaderboardItems.map((item, index) => (
                <Link
                  key={item.authorId ?? `${item.founder}-${index}`}
                  href={item.startupId ? `/startup/${item.startupSlug || item.startupId}` : "/leaderboard"}
                  className="glass"
                  style={{
                    padding: 14,
                    borderRadius: 20,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    textDecoration: "none",
                    color: "inherit",
                    cursor: "pointer",
                  }}
                  aria-label={item.startupId ? `Open ${item.startup}` : `Open leaderboard for ${item.founder}`}
                >
                  <CommunityAvatar label={item.avatar} src={item.avatarUrl} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800 }}>
                      {index + 1}. {item.founder}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--color-secondary)" }}>{item.startup}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "var(--color-accent)" }}>{item.points}</div>
                    <div style={{ fontSize: 11, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      points
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="glass" style={{ padding: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <Sparkles size={18} color="var(--color-accent)" />
              <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em" }}>Build in Public</h2>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {buildUpdates.map((item) => (
                <div
                  key={item.postId}
                  className="glass"
                  style={{
                    padding: 14,
                    borderRadius: 18,
                    display: "block",
                    textDecoration: "none",
                    color: "inherit",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    const postIndex = posts.findIndex((p) => p.id === item.postId);
                    if (postIndex !== -1 && postIndex >= visibleCount) {
                      setVisibleCount(postIndex + 1);
                    }
                    setExpandedPostId(item.postId);
                    setTimeout(() => {
                      const el = document.getElementById(item.postId);
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }, 100);
                  }}
                  aria-label={`View build update for ${item.startup}`}
                >
                  <div style={{ fontSize: 14, fontWeight: 800, color: "var(--color-text)", marginBottom: 2 }}>{item.startup}</div>
                  <div style={{ fontSize: 12, color: "var(--color-secondary)", marginBottom: 6 }}>by {item.founder}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.55 }}>{item.milestone}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="glass" style={{ padding: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <Flame size={18} color="var(--color-accent)" />
              <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em" }}>Trending Discussions</h2>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {trendingDiscussions.map((discussion) => (
                <button
                  key={discussion.postId}
                  className="glass"
                  style={{
                    padding: "14px 16px",
                    borderRadius: 18,
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    transition: "border-color 0.2s ease",
                  }}
                  onClick={() => {
                    const postIndex = posts.findIndex((p) => p.id === discussion.postId);
                    if (postIndex !== -1 && postIndex >= visibleCount) {
                      setVisibleCount(postIndex + 1);
                    }
                    setExpandedPostId(discussion.postId);
                    setTimeout(() => {
                      const el = document.getElementById(discussion.postId);
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }, 100);
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8, alignItems: "flex-start" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.5, color: "var(--color-text)" }}>{discussion.title}</div>
                    <ChevronRight size={15} color="var(--color-secondary)" style={{ flexShrink: 0, marginTop: 2 }} />
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 11, color: "var(--color-secondary)" }}>
                    <span style={{ color: "var(--color-secondary)" }}>{discussion.comments} comments</span>
                    <span style={{ color: "var(--color-secondary)" }}>{discussion.upvotes} upvotes</span>
                    <span style={{ color: "var(--color-accent)", fontWeight: 700 }}>{discussion.category}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="glass" style={{ padding: 22 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Community Stats</h2>
            <div style={{ display: "grid", gap: 12 }}>
              {[
                { label: "Total founders", value: totalFounders.toLocaleString() },
                { label: "Total startups", value: totalStartups.toLocaleString() },
                { label: "Posts today", value: postsToday.toLocaleString() },
              ].map((stat) => (
                <div key={stat.label} className="glass" style={{ padding: 16, borderRadius: 20 }}>
                  <div style={{ fontSize: 12, color: "var(--color-secondary)", marginBottom: 6 }}>{stat.label}</div>
                  <div style={{ fontSize: 28, lineHeight: 1, fontWeight: 800 }}>{stat.value}</div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {isMounted && postMode
        ? createPortal(
            <div className="modal-overlay" onClick={closeComposer}>
              <div className="modal-card" style={{ maxWidth: 620, width: "100%" }} onClick={(event) => event.stopPropagation()}>
                <button className="modal-close" onClick={closeComposer}>
                  <X size={18} />
                </button>
                <div className="modal-header">
                  <div
                    className="glass"
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 18,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 12,
                    }}
                  >
                    {postMode === "update" ? (
                      <TrendingUp size={24} color="var(--color-accent)" />
                    ) : (
                      <MessageSquarePlus size={24} color="var(--color-accent)" />
                    )}
                  </div>
              Create Post
                  <div className="modal-subtitle">Share a milestone, experiment, or founder question with the community.</div>
                </div>
                <div className="modal-form" style={{ gap: 16 }}>
                  <label className="modal-label">
                    Content
                    <textarea
                      className="modal-input modal-textarea"
                      placeholder={
                        postMode === "update"
                          ? "What happened this week in your startup?"
                          : "What do you want other founders to weigh in on?"
                      }
                      value={draftContent}
                      onChange={(event) => setDraftContent(event.target.value)}
                    />
                  </label>
                  <div className="community-modal-grid">
                    <label className="modal-label">
                      Select tag
                      <select className="modal-input" value={draftTag} onChange={(event) => setDraftTag(event.target.value)}>
                        {TAGS.map((tag) => (
                          <option key={tag} value={tag}>
                            {tag}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="modal-label">
                      Attach startup
                      <select className="modal-input" value={draftStartup} onChange={(event) => setDraftStartup(event.target.value)}>
                        {STARTUP_OPTIONS.map((startup) => (
                          <option key={startup} value={startup}>
                            {startup}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="modal-label">
                    Screenshot
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: "none" }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ justifyContent: "flex-start", opacity: isUploadingImage ? 0.6 : 1 }}
                      onClick={() => !isUploadingImage && imageInputRef.current?.click()}
                      disabled={isUploadingImage}
                    >
                      <ImagePlus size={16} />
                      {isUploadingImage ? "Uploading..." : draftImage ? "Change screenshot" : "Add screenshot"}
                    </button>
                    <div style={{ fontSize: 12, color: "var(--color-muted)" }}>PNG, JPG, or WEBP up to 4 MB.</div>
                    
                    {isUploadingImage && (
                      <div className="glass pulse-animation" style={{ 
                        height: 220, 
                        borderRadius: 18, 
                        marginTop: 4,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                        gap: 12
                      }}>
                        <div className="upload-spinner" />
                        <span style={{ fontSize: 13, color: "var(--color-secondary)" }}>Processing image...</span>
                      </div>
                    )}

                    {draftImage && !isUploadingImage ? (
                      <div
                        className="glass"
                        style={{ padding: 12, borderRadius: 18, display: "grid", gap: 10, marginTop: 4 }}
                      >
                        <img
                          src={draftImage}
                          alt="Draft screenshot preview"
                          style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 14 }}
                        />
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                          <div style={{ fontSize: 12, color: "var(--color-secondary)" }}>{draftImageName}</div>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={removeDraftImage}>
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </label>
                  {draftError ? <div style={{ fontSize: 13, color: "#fca5a5" }}>{draftError}</div> : null}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 14,
                      alignItems: "center",
                      flexWrap: "wrap",
                      marginTop: 4,
                    }}
                  >
                    <div style={{ fontSize: 13, color: "var(--color-secondary)" }}>
                      Posting is instant and keeps the feed live without a page refresh.
                    </div>
                    <button
                      type="button"
                      className="modal-btn-primary"
                      onClick={handlePublishPost}
                      disabled={!draftContent.trim() || isUploadingImage}
                      style={{ opacity: draftContent.trim() && !isUploadingImage ? 1 : 0.55 }}
                    >
                      {postMode === "update" ? "Publish update" : "Publish discussion"}
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}

      <style jsx>{`
        .community-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.6fr) minmax(290px, 0.8fr);
          gap: 22px;
          align-items: start;
        }

        .community-bottom-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 22px;
        }

        .community-modal-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        @media (max-width: 1100px) {
          .community-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 780px) {
          .community-hero {
            padding: 28px 20px 24px !important;
          }

          .community-hero h1 {
            font-size: 38px !important;
          }

          .community-bottom-grid,
          .community-modal-grid {
            grid-template-columns: 1fr;
          }
        }

        .upload-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(126, 161, 255, 0.1);
          border-top: 3px solid var(--color-accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .pulse-animation {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
































































