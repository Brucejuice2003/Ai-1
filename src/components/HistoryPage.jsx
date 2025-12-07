import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Music,
  FileAudio,
  Trash2,
  MoreVertical,
  Download,
  Share2,
  Star,
  Filter,
  Search,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { PageContainer, PageHeader, EmptyState } from './layout/PageContainer';
import { Card } from './ui/Card';
import { Button, IconButton } from './ui/Button';
import { Badge } from './ui/Badge';
import { SearchInput } from './ui/Input';
import { BlurFade } from './ui/BlurFade';
import { SkeletonListItem } from './ui/Skeleton';

// Mock data for history items
const mockHistory = [
  {
    id: 1,
    type: 'file',
    name: 'vocal_take_03.mp3',
    key: 'C Major',
    bpm: 120,
    voiceType: 'Chest Voice',
    analyzedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    duration: '3:42',
    starred: true,
  },
  {
    id: 2,
    type: 'song',
    name: 'Bohemian Rhapsody',
    artist: 'Queen',
    key: 'Bb Major',
    bpm: 72,
    analyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    coverUrl: null,
    starred: false,
  },
  {
    id: 3,
    type: 'live',
    name: 'Live Session',
    key: 'G Minor',
    bpm: 95,
    voiceType: 'Mix Voice',
    analyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    duration: '15:30',
    starred: false,
  },
  {
    id: 4,
    type: 'file',
    name: 'demo_track.wav',
    key: 'A Minor',
    bpm: 140,
    voiceType: 'Head Voice',
    analyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    duration: '4:15',
    starred: true,
  },
];

function formatRelativeTime(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function HistoryItem({ item, onDelete, onToggleStar }) {
  const [showMenu, setShowMenu] = useState(false);

  const typeIcons = {
    file: FileAudio,
    song: Music,
    live: Clock,
  };

  const TypeIcon = typeIcons[item.type] || FileAudio;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative"
    >
      <Card
        variant="default"
        padding="none"
        className="flex items-center gap-4 p-4 hover:bg-surface-3/50 transition-colors"
      >
        {/* Icon/Cover */}
        <div className="w-12 h-12 rounded-lg bg-surface-3 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {item.coverUrl ? (
            <img src={item.coverUrl} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <TypeIcon className="w-5 h-5 text-text-muted" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-white truncate">{item.name}</h3>
            {item.starred && (
              <Star className="w-3.5 h-3.5 text-warning fill-warning flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {item.artist && (
              <span className="text-sm text-text-muted truncate">{item.artist}</span>
            )}
            {item.duration && (
              <span className="text-sm text-text-muted">{item.duration}</span>
            )}
            <span className="text-sm text-text-dim">
              {formatRelativeTime(item.analyzedAt)}
            </span>
          </div>
        </div>

        {/* Key & BPM */}
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          <Badge variant="secondary" size="sm">{item.key}</Badge>
          <Badge variant="default" size="sm">{item.bpm} BPM</Badge>
        </div>

        {/* Actions */}
        <div className="relative flex-shrink-0">
          <IconButton
            variant="ghost"
            size="sm"
            onClick={() => setShowMenu(!showMenu)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4" />
          </IconButton>

          {/* Dropdown menu */}
          <AnimatePresence>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-full mt-1 z-20 w-40 py-1 bg-surface-3 border border-border-default rounded-lg shadow-xl"
                >
                  <button
                    onClick={() => { onToggleStar(item.id); setShowMenu(false); }}
                    className="w-full px-3 py-2 text-sm text-left text-text-secondary hover:text-white hover:bg-surface-4 flex items-center gap-2"
                  >
                    <Star className="w-4 h-4" />
                    {item.starred ? 'Unstar' : 'Star'}
                  </button>
                  <button
                    className="w-full px-3 py-2 text-sm text-left text-text-secondary hover:text-white hover:bg-surface-4 flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  <button
                    className="w-full px-3 py-2 text-sm text-left text-text-secondary hover:text-white hover:bg-surface-4 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                  <hr className="my-1 border-border-subtle" />
                  <button
                    onClick={() => { onDelete(item.id); setShowMenu(false); }}
                    className="w-full px-3 py-2 text-sm text-left text-error hover:bg-error/10 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
}

export default function HistoryPage() {
  const [history, setHistory] = useState(mockHistory);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, starred, files, songs
  const [loading, setLoading] = useState(false);

  const filteredHistory = history.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'starred' && item.starred) ||
      (filter === 'files' && item.type === 'file') ||
      (filter === 'songs' && item.type === 'song');
    return matchesSearch && matchesFilter;
  });

  const handleDelete = (id) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleToggleStar = (id) => {
    setHistory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, starred: !item.starred } : item
      )
    );
  };

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'starred', label: 'Starred' },
    { value: 'files', label: 'Files' },
    { value: 'songs', label: 'Songs' },
  ];

  return (
    <PageContainer maxWidth="4xl" className="py-8">
      <BlurFade delay={0}>
        <PageHeader
          title="History"
          description="Your past analyses and saved songs"
          actions={
            <Button variant="secondary" size="sm" leftIcon={<Download className="w-4 h-4" />}>
              Export All
            </Button>
          }
        />
      </BlurFade>

      {/* Search & Filters */}
      <BlurFade delay={0.1}>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <SearchInput
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  filter === option.value
                    ? 'bg-primary text-white'
                    : 'bg-surface-2 text-text-secondary hover:text-white hover:bg-surface-3'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </BlurFade>

      {/* History List */}
      <BlurFade delay={0.2}>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonListItem key={i} />
            ))}
          </div>
        ) : filteredHistory.length > 0 ? (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredHistory.map((item) => (
                <HistoryItem
                  key={item.id}
                  item={item}
                  onDelete={handleDelete}
                  onToggleStar={handleToggleStar}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <EmptyState
            icon={Clock}
            title="No history yet"
            description={
              searchQuery
                ? 'No results found for your search'
                : 'Your analyzed files and songs will appear here'
            }
            action={
              searchQuery && (
                <Button
                  variant="secondary"
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search
                </Button>
              )
            }
          />
        )}
      </BlurFade>

      {/* Stats summary */}
      {filteredHistory.length > 0 && (
        <BlurFade delay={0.3}>
          <div className="mt-8 pt-6 border-t border-border-subtle">
            <div className="flex items-center justify-between text-sm text-text-muted">
              <span>{filteredHistory.length} items</span>
              <span>
                {filteredHistory.filter((i) => i.starred).length} starred
              </span>
            </div>
          </div>
        </BlurFade>
      )}
    </PageContainer>
  );
}
