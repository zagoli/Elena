import {Component, Input} from '@angular/core';
import {CalendarEvent} from "../types/CalendarEvent";
import {DatePipe} from "@angular/common";

@Component({
	selector: 'app-calendar-event',
	standalone: true,
	imports: [
		DatePipe
	],
	templateUrl: './calendar-event.component.html',
	styleUrl: './calendar-event.component.css'
})
export class CalendarEventComponent {

	@Input({required: true})
	event?: CalendarEvent;

}
