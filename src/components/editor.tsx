import { ComponentProps, createEffect, createMemo, onCleanup, splitProps } from 'solid-js'

import { when } from '../utils'
import { useRepl } from './use-repl'

export type EditorProps = Omit<ComponentProps<'div'>, 'ref'> & {
  initialValue?: string
  path: string
  import?: string
}

export function ReplEditor(props: EditorProps) {
  const [, rest] = splitProps(props, ['initialValue', 'class'])
  const repl = useRepl()

  // Initialize html-element of monaco-editor
  const container = (<div class={props.class} {...rest} />) as HTMLDivElement

  // Get or create file
  const file = createMemo(() => repl.fs.get(props.path) || repl.fs.create(props.path))

  // Create monaco-editor
  const editor = repl.fs.monaco.editor.create(container, {
    value: '',
    language: 'typescript',
    automaticLayout: true,
  })

  // Update monaco-editor's model to current file's model
  createEffect(() => when(file)(file => editor.setModel(file.model)))

  // Add action to context-menu of monaco-editor
  createEffect(() => {
    if (repl.fs.config.actions?.saveRepl === false) return
    const cleanup = editor.addAction({
      id: 'save-repl',
      label: 'Save Repl',
      keybindings: [repl.fs.monaco.KeyMod.CtrlCmd | repl.fs.monaco.KeyCode.KeyY], // Optional: set a keybinding
      precondition: undefined,
      keybindingContext: undefined,
      contextMenuGroupId: 'repl',
      run: () => repl.fs.download(),
    })
    onCleanup(() => cleanup.dispose())
  })

  // Dispose monaco-editor after cleanup
  onCleanup(() => editor.dispose())

  return container
}
