import {Component} from '@angular/core';
import {CalendarEventsService} from "../calendar-events.service";
import {FormControl, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {CalendarEvent} from "../types/CalendarEvent"
import {CalendarEventComponent} from "../calendar-event/calendar-event.component";
// @ts-ignore
import * as ICAL from 'ical.js';

@Component({
	selector: 'app-calendar-events-list',
	standalone: true,
	imports: [
		FormsModule,
		CalendarEventComponent,
		ReactiveFormsModule
	],
	templateUrl: './calendar-events-list.component.html',
	styleUrl: './calendar-events-list.component.css'
})
export class CalendarEventsListComponent {

	urlSet = false;
	todayEvents: CalendarEvent[] = [];
	calendarUrl = new FormControl("");
	private today = new Date(2024, 2, 28);
	private updateFrequencySeconds = 3600;

	constructor(private calendarEventsService: CalendarEventsService) {
	}

	startUpdates() {
		this.getEvents();
		setInterval(() => {
			this.today = new Date();
			this.todayEvents = [];
			this.getEvents();
		}, 1000 * this.updateFrequencySeconds);
	}

	getEvents(): void {
		this.calendarEventsService.getCalendarFile("https://corsproxy.io/?" + this.calendarUrl.value)
			.subscribe(icsEvents => {
				const calendarEvents = this.icsEventsToCalendarEvents(icsEvents);
				this.todayEvents = this.todayEvents.concat(this.getEventsHappeningToday(calendarEvents));
				this.todayEvents = this.todayEvents.concat(this.getRecurrentEventsHappeningToday(icsEvents));
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
			return this.datesEquals(e.startDate, this.today);
		});
	}

	private getRecurrentEventsHappeningToday(events: any[]): CalendarEvent[] {
		let recurrentPastEvents = events.filter((e: any) => {
			return e.isRecurring() && e.startDate.toJSDate() <= this.today;
		});
		recurrentPastEvents = recurrentPastEvents.filter((e: any) => {
			return this.doesRecurrentPastEventHappenToday(e);
		});
		return this.icsEventsToCalendarEvents(recurrentPastEvents);
	}

	private doesRecurrentPastEventHappenToday(event: any): boolean {
		const expand = new ICAL.RecurExpansion({
			component: event.component,
			dtstart: event.startDate
		});

		let next = expand.next();
		do {
			if (this.datesEquals(next.toJSDate(), this.today))
				return true;
		} while ((next = expand.next()) && this.datesLessEquals(next.toJSDate(), this.today));

		return false;
	}

	private datesLessEquals(date1: Date, date2: Date) {
		return date1 < date2 || this.datesEquals(date1, date2);
	}

	private datesEquals(date1: Date, date2: Date): boolean {
		const firstDate = structuredClone(date1);
		const secondDate = structuredClone(date2);
		firstDate.setHours(0, 0, 0, 0);
		secondDate.setHours(0, 0, 0, 0);
		return firstDate.getTime() === secondDate.getTime();
	}

}
