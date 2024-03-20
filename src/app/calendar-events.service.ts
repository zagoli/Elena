import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {map, Observable} from "rxjs";
// @ts-ignore
import * as ICAL from 'ical.js';

@Injectable({
	providedIn: 'root'
})
export class CalendarEventsService {

	constructor(private httpClient: HttpClient) {
	}

	getCalendarFile(calendarUrl: string): Observable<any[]> {
		return this.httpClient.get(calendarUrl, {responseType: "text"})
			.pipe(
				map((ics: string) => {
					const jCalData = ICAL.parse(ics);
					const ICalendar = new ICAL.Component(jCalData);
					return ICalendar.getAllSubcomponents('vevent').map((e: any) => new ICAL.Event(e));
				})
			)

	}

}
