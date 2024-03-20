import {Component} from '@angular/core';
import {CalendarEventsService} from "../calendar-events.service";
import {FormsModule} from "@angular/forms";
import {CalendarEvent} from "../types/CalendarEvent"
import {CalendarEventComponent} from "../calendar-event/calendar-event.component";

@Component({
	selector: 'app-calendar-events-list',
	standalone: true,
	imports: [
		FormsModule,
		CalendarEventComponent
	],
	templateUrl: './calendar-events-list.component.html',
	styleUrl: './calendar-events-list.component.css'
})
export class CalendarEventsListComponent {

	urlSet = false;
	todayEvents: CalendarEvent[] = [];
	calendarUrl: string = "";
	private today = new Date(2023, 0, 1);

	constructor(private calendarEventsService: CalendarEventsService) {
	}

	// https://ics.calendarlabs.com/53/556c8add/Italy_Holidays.ics

	getEvents(): void {
		this.calendarEventsService.getCalendarFile(this.calendarUrl)
			.subscribe(icsEvents => {
				const calendarEvents = this.icsEventsToCalendarEvents(icsEvents);
				this.todayEvents = this.todayEvents.concat(this.getEventsHappeningToday(calendarEvents));
				console.log(this.getRecurrentEventsHappeningToday(icsEvents));
			});
		this.urlSet = true;
	}

	private icsEventToCalendarEvent(icsEvent: any): CalendarEvent {
		return {
			summary: icsEvent.summary,
			startDate: icsEvent.startDate.toJSDate(),
			endDate: icsEvent.endDate.toJSDate(),
			location: icsEvent.location
		}
	}

	private icsEventsToCalendarEvents(icsEvents: any[]): CalendarEvent[] {
		return icsEvents.map(e => this.icsEventToCalendarEvent(e));
	}

	private getEventsHappeningToday(events: CalendarEvent[]): CalendarEvent[] {
		return events.filter((e: CalendarEvent) => {
			return e.startDate <= this.today && e.endDate >= this.today;
		});
	}

	private getRecurrentEventsHappeningToday(events: any[]): CalendarEvent[] {
		const recurrentPastEvents = events.filter((e: any) => {
			return e.isRecurring() && e.startDate.toJSDate() <= this.today;
		});
		return this.icsEventsToCalendarEvents(recurrentPastEvents);
	}

}
