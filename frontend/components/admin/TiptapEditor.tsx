'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Heading2, Heading3,
  Quote, Minus, Code, Link as LinkIcon,
  Undo, Redo,
} from 'lucide-react';

interface Props {
  value: string;
  onChange: (html: string) => void;
}

const btn = (active = false) =>
  `rounded p-1.5 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30 ${
    active ? 'bg-gray-200 text-gray-900' : 'text-gray-500'
  }`;

const Divider = () => <div className="mx-1 h-4 w-px shrink-0 bg-gray-200" />;

export default function TiptapEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
    ],
    content: value,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'min-h-[200px] w-full rounded-b-xl border-x border-b border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 prose prose-sm max-w-none',
      },
    },
  });

  if (!editor) return null;

  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL посилання', prev ?? 'https://');
    if (url === null) return;
    if (url === '') { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-0.5 rounded-t-xl border border-gray-200 bg-gray-50 px-2 py-1.5">
        {/* History */}
        <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className={btn()} title="Відмінити"><Undo className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className={btn()} title="Повторити"><Redo className="h-3.5 w-3.5" /></button>

        <Divider />

        {/* Headings */}
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive('heading', { level: 2 }))} title="Заголовок H2"><Heading2 className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btn(editor.isActive('heading', { level: 3 }))} title="Заголовок H3"><Heading3 className="h-3.5 w-3.5" /></button>

        <Divider />

        {/* Formatting */}
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive('bold'))} title="Жирний"><Bold className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive('italic'))} title="Курсив"><Italic className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btn(editor.isActive('underline'))} title="Підкреслений"><UnderlineIcon className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btn(editor.isActive('strike'))} title="Закреслений"><Strikethrough className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleCode().run()} className={btn(editor.isActive('code'))} title="Код"><Code className="h-3.5 w-3.5" /></button>

        <Divider />

        {/* Lists */}
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive('bulletList'))} title="Маркований список"><List className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive('orderedList'))} title="Нумерований список"><ListOrdered className="h-3.5 w-3.5" /></button>

        <Divider />

        {/* Block */}
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn(editor.isActive('blockquote'))} title="Цитата"><Quote className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btn()} title="Горизонтальна лінія"><Minus className="h-3.5 w-3.5" /></button>

        <Divider />

        {/* Link */}
        <button type="button" onClick={setLink} className={btn(editor.isActive('link'))} title="Посилання"><LinkIcon className="h-3.5 w-3.5" /></button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
