import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {CalendarComponent} from "./calendar/calendar.component";
import {CalendarEventsListComponent} from "./calendar-events-list/calendar-events-list.component";

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [RouterOutlet, CalendarComponent, CalendarEventsListComponent],
	templateUrl: './app.component.html',
	styleUrl: './app.component.css'
})
export class AppComponent {
	hideEvents = false;

	toggleFullscreenCalendar(noEvents: boolean) {
		this.hideEvents = noEvents;
	}
}
