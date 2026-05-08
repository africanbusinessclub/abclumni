import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import './RichTextEditor.css'

interface RichTextEditorProps {
    value: string
    onChange: (_value: string) => void
    placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [StarterKit],
        content: value,
        onUpdate({ editor }) {
            onChange(editor.getHTML())
        },
        editorProps: {
            attributes: {
                class: 'rich-editor-content',
                'aria-placeholder': placeholder ?? '',
            },
        },
    })

    return (
        <div className="rich-editor-wrapper">
            <div className="rich-editor-toolbar">
                <button
                    type="button"
                    className={editor?.isActive('bold') ? 'active' : ''}
                    onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBold().run() }}
                    title="Gras"
                >B</button>
                <button
                    type="button"
                    className={editor?.isActive('italic') ? 'active' : ''}
                    onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleItalic().run() }}
                    title="Italique"
                ><em>I</em></button>
                <button
                    type="button"
                    className={editor?.isActive('bulletList') ? 'active' : ''}
                    onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBulletList().run() }}
                    title="Liste à puces"
                >• —</button>
                <button
                    type="button"
                    className={editor?.isActive('orderedList') ? 'active' : ''}
                    onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleOrderedList().run() }}
                    title="Liste numérotée"
                >1. —</button>
                <button
                    type="button"
                    className={editor?.isActive('heading', { level: 3 }) ? 'active' : ''}
                    onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleHeading({ level: 3 }).run() }}
                    title="Titre"
                >H3</button>
            </div>
            <EditorContent editor={editor} />
        </div>
    )
}
