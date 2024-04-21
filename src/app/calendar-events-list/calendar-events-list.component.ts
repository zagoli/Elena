import {Component, EventEmitter, Output} from '@angular/core';
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
		this.todayEvents = this.todayEvents.filter((event) => event.endDate > this.today);
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

		this.todayEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
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
		return events.filter((e: CalendarEvent) => this.datesEquals(e.startDate, this.today));
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
