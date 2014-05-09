(function ($) {

    $(document).bind("flagGlobalAfterLinkUpdate", function(event, data) {
        var node = $("#node-" + data.contentId);
        node.toggleClass("attending", data.flagStatus == "flagged");

        var participants = node.find(".field-name-field-participants > .field-items");

        var count = node.find(".participants-count").text();
        if (data.flagStatus == "unflagged") {
            participants.find(".field-item").filter(function() {
                return $(this).text() === Drupal.settings.luz.user_name;
            }).remove();
        }
        else if (data.flagStatus == "flagged") {
            var item = '<div class="field-item">' + Drupal.settings.luz.user_name + "</div>";
            participants.append(item);
        }
    });

    $(document).ready(function() {
       $("#navbar .primary-nav a").click(function(event) {
           event.preventDefault();

           var link = $(event.currentTarget);
           $("#navbar .primary-nav .active").removeClass("active");
           link.addClass("active").parent().addClass("active");
           $("#luz-wrapper").removeClass("week-0 week-1 week-2 week-3").addClass("week-" + link.data("week"));
       });

        $("#navbar .primary-nav a.active").click();

        if (window.innerWidth > 1200) {
            $("#video-wrapper").load(Drupal.settings.basePath + "luz/get-video");
        }

        $("#luz-wrapper .node").hover(function(event){
            $(event.currentTarget).toggleClass("inactive", event.type == 'mouseleave');
        });
    });
})(jQuery);
