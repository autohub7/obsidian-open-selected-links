import { Editor, MarkdownView, Plugin, TFile } from 'obsidian';

export default class MyPlugin extends Plugin {
	async onload() {
		this.addCommand({
			id: 'select-open-links',
			name: 'Select Open Links',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.selectOpenTexts(view)
			}
		});
	}

	selectOpenTexts(view: MarkdownView) {
		var files = this.getFilesName(view);
		files.forEach((fileName) => {
			console.log(fileName)
			if(fileName) this.app.workspace.openLinkText(fileName, "", "tab", {active: false})
		})
	}
		
	// https://github.com/mrjackphil/obsidian-crosslink-between-notes
	getFilesName(view: MarkdownView) {
		const cm = view.editor
        const cursor = cm.getCursor()
        const selectedRange = cm.getSelection()
        const line = selectedRange || cm.getLine(cursor.line)

        const regexpWiki = /\[\[.+?]]/gi
        const linksWiki = line.match(regexpWiki) || []

        const ar = [linksWiki].filter(e => e.length)

        return ar.flat().map((lnk) => {
            const wikiName = lnk
                .replace(/(\[\[|]])/g, '')
                .replace(/\|.+/, '')
                .replace(/#.+/, '')

            return wikiName
        })
	}

	getFilesFromLineOrSelection(view: MarkdownView): TFile[] {
        const cm = view.editor
        const cursor = cm.getCursor()
        const selectedRange = cm.getSelection()
        const line = selectedRange || cm.getLine(cursor.line)

        const regexpWiki = /\[\[.+?]]/gi
        const linksWiki = line.match(regexpWiki) || []
        const ar = [linksWiki].filter(e => e.length)

        return ar.flat().map((lnk) => {
            const wikiName = lnk
                .replace(/(\[\[|]])/g, '')
                .replace(/\|.+/, '')
                .replace(/#.+/, '')

			console.log('wikiName    ', wikiName);
            return this.getFilesByName(wikiName)
        })
    }

	getFilesByName(name: string | string[]) {
        const files = this.app.vault.getFiles()

        if (Array.isArray(name)) {
            return files.filter(e => name.includes(e.name)
                || name.includes((e.path))
                || name.includes(e.basename)
            )[0]
        }

        return files.filter(e => e.name === name
            || e.path === name
            || e.basename === name
        )[0]
    }

	onunload() {

	}
}