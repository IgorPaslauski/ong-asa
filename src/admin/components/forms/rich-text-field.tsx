import { useEffect, type ReactNode } from 'react'
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  BoldIcon,
  CodeIcon,
  Heading2Icon,
  Heading3Icon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  QuoteIcon,
  Redo2Icon,
  SquareCodeIcon,
  StrikethroughIcon,
  UnderlineIcon,
  Undo2Icon,
} from 'lucide-react'
import { FormDescription, FormField, FormItem, FormLabel, FormMessage, useFormField } from '@/admin/components/ui/form'
import { cn } from '@/admin/lib/utils'
import './rich-text.css'

function ToolButton({ label, active, disabled, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      className="rte-btn"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      // mousedown evita que o clique tire o foco do editor
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function askLink(editor: Editor) {
  const previous = editor.getAttributes('link').href as string | undefined
  const input = window.prompt('Endereço do link (começa com https://). Deixe vazio para remover.', previous ?? 'https://')
  if (input === null) return
  const url = input.trim()
  if (url === '' || url === 'https://') {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  const href = /^(https?:|mailto:|tel:)/i.test(url) ? url : `https://${url}`
  editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
}

function Toolbar({ editor }: { editor: Editor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      code: e.isActive('code'),
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      ul: e.isActive('bulletList'),
      ol: e.isActive('orderedList'),
      quote: e.isActive('blockquote'),
      codeBlock: e.isActive('codeBlock'),
      link: e.isActive('link'),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  })
  const run = () => editor.chain().focus()
  return (
    <div className="rte-toolbar" role="toolbar" aria-label="Formatação do texto">
      <ToolButton label="Negrito (Ctrl+B)" active={s.bold} onClick={() => run().toggleBold().run()}><BoldIcon /></ToolButton>
      <ToolButton label="Itálico (Ctrl+I)" active={s.italic} onClick={() => run().toggleItalic().run()}><ItalicIcon /></ToolButton>
      <ToolButton label="Sublinhado (Ctrl+U)" active={s.underline} onClick={() => run().toggleUnderline().run()}><UnderlineIcon /></ToolButton>
      <ToolButton label="Riscado" active={s.strike} onClick={() => run().toggleStrike().run()}><StrikethroughIcon /></ToolButton>
      <ToolButton label="Código" active={s.code} onClick={() => run().toggleCode().run()}><CodeIcon /></ToolButton>
      <span className="rte-sep" aria-hidden="true" />
      <ToolButton label="Título" active={s.h2} onClick={() => run().toggleHeading({ level: 2 }).run()}><Heading2Icon /></ToolButton>
      <ToolButton label="Subtítulo" active={s.h3} onClick={() => run().toggleHeading({ level: 3 }).run()}><Heading3Icon /></ToolButton>
      <span className="rte-sep" aria-hidden="true" />
      <ToolButton label="Lista com marcadores" active={s.ul} onClick={() => run().toggleBulletList().run()}><ListIcon /></ToolButton>
      <ToolButton label="Lista numerada" active={s.ol} onClick={() => run().toggleOrderedList().run()}><ListOrderedIcon /></ToolButton>
      <ToolButton label="Citação" active={s.quote} onClick={() => run().toggleBlockquote().run()}><QuoteIcon /></ToolButton>
      <ToolButton label="Bloco de código" active={s.codeBlock} onClick={() => run().toggleCodeBlock().run()}><SquareCodeIcon /></ToolButton>
      <ToolButton label="Linha divisória" onClick={() => run().setHorizontalRule().run()}><MinusIcon /></ToolButton>
      <span className="rte-sep" aria-hidden="true" />
      <ToolButton label="Link" active={s.link} onClick={() => askLink(editor)}><LinkIcon /></ToolButton>
      <span className="rte-sep" aria-hidden="true" />
      <ToolButton label="Desfazer (Ctrl+Z)" disabled={!s.canUndo} onClick={() => run().undo().run()}><Undo2Icon /></ToolButton>
      <ToolButton label="Refazer (Ctrl+Shift+Z)" disabled={!s.canRedo} onClick={() => run().redo().run()}><Redo2Icon /></ToolButton>
    </div>
  )
}

function RichTextEditor({ value, onChange, onBlur, invalid }: { value: string; onChange: (html: string) => void; onBlur: () => void; invalid: boolean }) {
  const { formItemId, formDescriptionId, formMessageId } = useFormField()
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer nofollow' } } })],
    content: value,
    editorProps: {
      attributes: {
        id: formItemId,
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': 'Texto da notícia',
        'aria-describedby': `${formDescriptionId} ${formMessageId}`,
        'aria-invalid': String(invalid),
        class: 'rte-content',
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? '' : e.getHTML()),
    onBlur,
  })

  // Quando o formulário é reiniciado (novo post / editar outro), troca o conteúdo do editor.
  useEffect(() => {
    if (editor && value !== (editor.isEmpty ? '' : editor.getHTML())) editor.commands.setContent(value, { emitUpdate: false })
  }, [editor, value])

  if (!editor) return null
  return (
    <div className={cn('rte', invalid && 'rte--invalid')}>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

/** Editor de texto formatado (negrito, itálico, código, títulos, listas, links…) ligado ao react-hook-form. O valor é HTML. */
export function RichTextField({ control, name, label, required, description, className }: { control: any; name: string; label: string; required?: boolean; description?: ReactNode; className?: string }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={className}>
          <FormLabel required={required}>{label}</FormLabel>
          <RichTextEditor value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} invalid={!!fieldState.error} />
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
