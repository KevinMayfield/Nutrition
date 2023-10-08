import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
    name: 'safeHtml'
})
export class SafeHtmlPipe implements PipeTransform {

    constructor(protected sanitizer: DomSanitizer) {}

    public transform(value: any): any {
        console.log('sanitize ' + value)
        return this.sanitizer.bypassSecurityTrustHtml(value);
    }
}
