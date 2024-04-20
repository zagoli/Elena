import {Component, OnInit} from '@angular/core';
import {DatePipe, TitleCasePipe} from "@angular/common";

@Component({
	selector: 'app-calendar',
	standalone: true,
	imports: [
		DatePipe,
		TitleCasePipe
	],
	templateUrl: './calendar.component.html',
	styleUrl: './calendar.component.css'
})
export class CalendarComponent implements OnInit {
	date: Date = new Date();
	private updateDateFrequencyMilliseconds = 100;
	protected readonly document = document;

	ngOnInit(): void {
		this.updateDate();
		setInterval(() => {
			this.updateDate()
		}, this.updateDateFrequencyMilliseconds);
	}

	private updateDate(): void {
		this.date = new Date();
	}

	toggleFullscreen(): void {
		if (document.fullscreenEnabled) {
			if (document.fullscreenElement != null) {
				void document.exitFullscreen();
			} else {
				void document.documentElement.requestFullscreen();
			}
		}
	}
}
