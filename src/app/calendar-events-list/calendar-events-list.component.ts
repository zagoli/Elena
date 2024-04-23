import {Component, EventEmitter, Output} from '@angular/core';
import {CalendarEventsService} from "../calendar-events.service";
import {FormControl, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {CalendarEvent} from "../types/CalendarEvent"
import {CalendarEventComponent} from "../calendar-event/calendar-event.component";
import {compareTime, datesEquals, datesLessEquals, timeGreater} from "../date-utils/date-utils";
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
	getEventsError = false;
	todayEvents: CalendarEvent[] = [];
	calendarUrl = new FormControl("");
	@Output() noEventsForToday = new EventEmitter<boolean>();

	private today = new Date();
	private updateFrequencySeconds = 3600;
	private removePastEventsFrequencySeconds = 60;

	constructor(private calendarEventsService: CalendarEventsService) {
	}

	startUpdates() {
		this.getEvents();
		setInterval(() => {
			this.getEvents();
		}, 1000 * this.updateFrequencySeconds);
		setInterval(() => {
			this.removePastEvents();
		}, 1000 * this.removePastEventsFrequencySeconds);
	}

	private updateDate() {
		this.today = new Date();
	}

	private removePastEvents(): void {
		this.updateDate();
		this.todayEvents = this.todayEvents.filter(
			(event) => timeGreater(event.endDate, this.today)
		);
	}

	private getEvents(): void {
		this.updateDate();
		this.calendarEventsService.getCalendarFile(this.calendarUrl.value!)
			.subscribe({
				next: icsEvents => {
					this.urlSet = true;
					this.getEventsError = false;
					this.addEvents(icsEvents);
					this.removePastEvents();
					this.sortEventsByTime();
					this.noEventsForToday.emit(this.todayEvents.length == 0);
				},
				error: () => {
					this.getEventsError = true;
					if (this.urlSet) {
						alert("Errore nell'aggiornamento degli eventi");
					}

				}
			});
	}

	private addEvents(icsEvents: any[]) {
		this.todayEvents = [];
		const calendarEvents = this.icsEventsToCalendarEvents(icsEvents);
		this.concatUniqueEvents(this.getEventsHappeningToday(calendarEvents));
		this.concatUniqueEvents(this.getRecurrentEventsHappeningToday(icsEvents));
	}

	private sortEventsByTime(): void {
		this.todayEvents.sort(
			(a, b) => compareTime(a.startDate, b.endDate)
		);
	}

	private concatUniqueEvents(events: CalendarEvent[]) {
		events.forEach(event => {
			const eventExists = this.todayEvents.some(existingEvent =>
				existingEvent.summary === event.summary &&
				existingEvent.startDate.getTime() === event.startDate.getTime() &&
				existingEvent.endDate.getTime() === event.endDate.getTime() &&
				existingEvent.location === event.location
			);

			if (!eventExists) {
				this.todayEvents.push(event);
			}
		});
	}

	private icsEventToCalendarEvent(icsEvent: any): CalendarEvent {
		return {
			summary: icsEvent.summary,
			startDate: icsEvent.startDate.toJSDate(),
			endDate: icsEvent.endDate.toJSDate(),
			description: icsEvent.description,
			location: icsEvent.location
		}
	}

	private icsEventsToCalendarEvents(icsEvents: any[]): CalendarEvent[] {
		return icsEvents.map(e => this.icsEventToCalendarEvent(e));
	}

	private getEventsHappeningToday(events: CalendarEvent[]): CalendarEvent[] {
		return events.filter((e: CalendarEvent) => datesEquals(e.startDate, this.today));
	}

	private getRecurrentEventsHappeningToday(events: any[]): CalendarEvent[] {
		let recurrentPastEvents = events.filter((e: any) =>
			e.isRecurring() && e.startDate.toJSDate() <= this.today
		);
		recurrentPastEvents = recurrentPastEvents.filter((e: any) =>
			this.doesRecurrentPastEventHappenToday(e)
		);
		return this.icsEventsToCalendarEvents(recurrentPastEvents);
	}

	private doesRecurrentPastEventHappenToday(event: any): boolean {
		const expand = new ICAL.RecurExpansion({
			component: event.component,
			dtstart: event.startDate
		});

		let next = expand.next();
		do {
			if (datesEquals(next.toJSDate(), this.today))
				return true;
		} while ((next = expand.next()) && datesLessEquals(next.toJSDate(), this.today));

		return false;
	}

}
